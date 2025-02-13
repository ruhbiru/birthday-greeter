import { randomUUID as uuidv4 } from "node:crypto";
import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { CronRepeatOptions, EveryRepeatOptions, JobOptions, Queue } from "bull";
import { ConfigService } from "@nestjs/config";
import { BaseControl } from "src/common/base/base.control";
import { JobConstants } from "../job.constants";
import { IJob } from "../job.interface";
import { IPeriodicMailSend } from "../base/periodic-mail-sender/periodic-mail-send.interface";

@Injectable()
export class BirthdayGreeterSendProducer extends BaseControl implements IJob {
  constructor(
    @InjectQueue(JobConstants.JOBS.BIRTHDAY_GREETER_SEND)
    private readonly queue: Queue,
    private configService: ConfigService
  ) {
    super();
  }

  async enqueue(data?: IPeriodicMailSend | null, opts?: JobOptions) {
    await this.queue.add(
      JobConstants.JOBS.BIRTHDAY_GREETER_SEND,
      data,
      Object.assign(
        {},
        {
          jobId: uuidv4(),
          removeOnComplete: 1000,
          removeOnFail: 1000,
          attempts: 3,
        },
        opts
      )
    );
  }

  async schedulerInit() {
    /**
     * when we change repeatable/cron job schedule,
     * it will create a new job with the new schedule instead of updating the existing one.
     * in that case, we need to remove the old one.
     */
    await this.removeExistingRepeatableJobs();

    const config: {
      job: { repeat: CronRepeatOptions | EveryRepeatOptions | undefined };
    } = this.configService.get("birthdayGreeterSend");

    this.enqueue(null, { repeat: config.job.repeat });
  }

  async removeExistingRepeatableJobs() {
    try {
      const jobs = await this.queue.getRepeatableJobs();
      for (let job of jobs) {
        await this.queue.removeRepeatableByKey(job.key);
      }
    } catch (error) {
      this.logger.error("Failed to reset repeatable job.", error);
    }
  }
}
