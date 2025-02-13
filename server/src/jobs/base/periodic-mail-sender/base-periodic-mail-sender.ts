import { FindOptions, literal, Op } from "sequelize";
import { BaseControl } from "src/common/base/base.control";
import { ICheckpoint } from "src/jobs/birthday-greeter-send/interfaces/checkpoint.interfaces";
import { IMailSenderService } from "./mail-sender-service.interface";
import { isEmpty } from "lodash";
import { ConfigService } from "@nestjs/config";
import { Job } from "bull";
import * as moment from "moment";
import { PeriodicMailSenderCheckpointCache } from "./periodic-mail-sender-checkpoint.cache";
import { BaseEntity } from "src/common/base/base.entity";
import { IPeriodicMailSend } from "./periodic-mail-send.interface";

const BATCH_SIZE = 50;

export abstract class BasePeriodicMailSender<
  M extends BaseEntity
> extends BaseControl {
  protected batchSize: number;
  constructor(
    protected readonly service: IMailSenderService<M>,
    protected readonly configService: ConfigService,
    protected checkpointCache: PeriodicMailSenderCheckpointCache,
    protected configName: string,
    protected moduleName: string,
    batchSize?: number
  ) {
    super();
    this.batchSize = batchSize || BATCH_SIZE;
  }

  async run(job: Job<IPeriodicMailSend>) {
    const checkpoint = await this.getCheckpoint(job);
    const jobId: string = checkpoint.originalJobId;

    this.logger.log(`Sending ${this.moduleName}...`, jobId);

    const retryPeriod = this.getRetryPeriod();

    if (this.hasBeenRunningTooLong(checkpoint, retryPeriod)) {
      this.logger.error(
        "This job has been running too long.",
        checkpoint,
        jobId
      );
      return;
    }

    const serverSendTime = checkpoint.serverSendTime;
    const scheduledSendTime = checkpoint.scheduledSendTime;

    this.logger.log(
      `Server send time (UTC): ${serverSendTime}, Send time: ${scheduledSendTime} (user local time)`,
      jobId
    );

    let totalIds = await this.getTotalIds(checkpoint, jobId);

    let keepFetching = true;

    while (keepFetching && !checkpoint.complete) {
      this.logger.log(
        `fetching data with lastId: ${checkpoint.lastId || "-"}`,
        jobId
      );
      const data = await this.next(checkpoint);

      if (isEmpty(data) || data.length < this.batchSize) {
        keepFetching = false;
      }

      if (!isEmpty(data)) {
        const results = await Promise.all(
          data.map(async (item) => {
            let success = true;
            try {
              success = await this.sendEmail(item);
            } catch (error) {
              this.logger.error(
                `Error sending ${this.moduleName} to ${item.entityId}`,
                error,
                jobId
              );
              success = false;
            }
            return { id: item.entityId, success };
          })
        );

        for (let { id, success } of results) {
          if (success) {
            checkpoint.totalGreetedIds++;
            if (checkpoint.failedIds.has(id)) {
              checkpoint.failedIds.delete(id);
            }
          } else {
            checkpoint.failedIds.add(id);
          }
        }

        this.logger.log(
          `Successfully sent ${this.moduleName} to ${checkpoint.totalGreetedIds}/${totalIds} recipients.`,
          jobId
        );
      }

      this.updateCheckpoint(data, checkpoint, jobId);
    }

    if (!checkpoint.complete) {
      await this.pushRetryJob(checkpoint.originalJobId);
    } else {
      this.logger.log("completed", jobId);
    }
  }

  protected abstract sendEmail(data: M): Promise<boolean>;

  protected abstract pushRetryJob(jobId: string): Promise<void>;

  protected abstract getRetryPeriod(): number;

  protected hasBeenRunningTooLong(
    checkpoint: ICheckpoint,
    retryPeriod: number
  ) {
    const runningSince =
      checkpoint.runningSince instanceof Date
        ? checkpoint.runningSince
        : moment.utc(checkpoint.runningSince).toDate();

    const longestTimeLimit = new Date(
      runningSince.getTime() + retryPeriod * 60 * 1000
    );

    return longestTimeLimit <= moment.utc().toDate();
  }

  protected async getCheckpoint(job: Job<IPeriodicMailSend>) {
    const jobId: string = job.data?.originalJobId || (job.id as string);
    const today = moment.utc().toDate();
    const scheduledSendTime = this.configService.get(
      this.configName
    ).scheduledSendTime;

    let checkpoint = await this.checkpointCache.getCheckpoint(jobId);
    if (!checkpoint) {
      let { serverSendTime } = job.data || {};
      serverSendTime || this.getServerSendTime();
      let totalIds = await this.service.count(
        this.getDbQueryOptions(scheduledSendTime, serverSendTime)
      );

      checkpoint = {
        originalJobId: job.id as string,
        runningSince: today,
        isFirstTimeRunning: true,
        serverSendTime,
        scheduledSendTime,
        totalIds,
        totalGreetedIds: 0,
        complete: false,
        failedIds: new Set(),
      };

      await this.checkpointCache.setCheckpoint(checkpoint, jobId);
    }

    return checkpoint;
  }

  private getServerSendTime() {
    return this.roundDownTo15Minutes(moment.utc()).format(
      "YYYY-MM-DD HH:mm:00"
    );
  }

  private roundDownTo15Minutes(moment: moment.Moment) {
    const minutes = moment.minutes();
    const roundedMinutes = Math.floor(minutes / 15) * 15;
    return moment.minutes(roundedMinutes).seconds(0).milliseconds(0);
  }

  protected async next(checkpoint: ICheckpoint): Promise<M[]> {
    const { scheduledSendTime, serverSendTime } = checkpoint;
    const options = this.getDbQueryOptions(scheduledSendTime, serverSendTime);
    this.applyCheckpointCondition(options, checkpoint);
    this.applyOrderAndLimitCondition(options);
    return await this.service.findAll(options);
  }

  protected abstract getDbQueryOptions(
    scheduledSendTime: string,
    serverSendTime: string
  ): FindOptions;

  protected applyCheckpointCondition(
    options: FindOptions,
    checkpoint: ICheckpoint
  ) {
    const { lastId, lastEditedDate, failedIds, isFirstTimeRunning } =
      checkpoint;
    options.where = options.where || {};

    if (isEmpty(lastId) && !failedIds.size) {
      return options;
    }

    const andConditions = options.where[Op.and] || [];
    if (lastId) {
      andConditions.push({
        [Op.or]: [
          {
            [Op.and]: [
              { editedDate: { [Op.eq]: lastEditedDate } },
              { entityId: { [Op.gt]: lastId } },
            ],
          },
          { editedDate: { [Op.gt]: lastEditedDate } },
        ],
      });
    }

    if (!isFirstTimeRunning && failedIds.size) {
      andConditions.push({ entityId: { [Op.in]: Array.from(failedIds) } });
    }

    options.where[Op.and] = andConditions;

    return options;
  }

  protected applyOrderAndLimitCondition(options: FindOptions) {
    options.limit = this.batchSize;
    options.order = [
      ["editedDate", "ASC"],
      ["entityId", "ASC"],
    ];
    return options;
  }

  protected async updateCheckpoint(
    data: M[],
    checkpoint: ICheckpoint,
    jobId: string
  ) {
    if (!isEmpty(data)) {
      const lastData = data[data.length - 1];
      checkpoint.lastId = lastData.entityId;
      checkpoint.lastEditedDate = lastData.editedDate;
    }

    if (isEmpty(data) || data.length < BATCH_SIZE) {
      if (!checkpoint.failedIds.size) {
        checkpoint.complete = true;
      }
      checkpoint.isFirstTimeRunning = false;
      checkpoint.lastId = null;
      checkpoint.lastEditedDate = null;
    }

    if (!checkpoint.isFirstTimeRunning && !checkpoint.failedIds.size) {
      checkpoint.complete = true;
    }

    await this.checkpointCache.setCheckpoint(checkpoint, jobId);
  }

  protected async getTotalIds(checkpoint: ICheckpoint, jobId: string) {
    const { scheduledSendTime, serverSendTime } = checkpoint;
    const totalIds = await this.service.count(
      this.getDbQueryOptions(scheduledSendTime, serverSendTime)
    );

    if (totalIds !== checkpoint.totalIds) {
      checkpoint.totalIds = totalIds;
      await this.checkpointCache.setCheckpoint(checkpoint, jobId);
    }

    return checkpoint.totalIds;
  }
}
