import { Process, Processor } from "@nestjs/bull";
import { JobConstants } from "../job.constants";
import { Job } from "bull";
import { IPeriodicMailSend } from "../base/periodic-mail-sender/periodic-mail-send.interface";
import { UsersService } from "src/modules/users/services/users.service";
import { ConfigService } from "@nestjs/config";
import { FindOptions, Op, literal } from "sequelize";
import { User } from "src/modules/users/models/entities/user.entity";
import { BirthdayGreeterSendProducer } from "./birthday-greeter-send.producer";
import { LsHttpService } from "src/common/http/ls-http.service";
import { BasePeriodicMailSender } from "../base/periodic-mail-sender/base-periodic-mail-sender";
import { BirthdayGreeterSendCheckpointCache } from "./birthday-greeter-send-checkpoint.cache";

@Processor(JobConstants.JOBS.BIRTHDAY_GREETER_SEND)
export class BirthdayGreeterSendConsumer extends BasePeriodicMailSender<User> {
  constructor(
    usersService: UsersService,
    configService: ConfigService,
    checkpointCache: BirthdayGreeterSendCheckpointCache,
    private readonly birthdayGreeterSendProducer: BirthdayGreeterSendProducer,
    private readonly httpService: LsHttpService
  ) {
    super(
      usersService,
      configService,
      checkpointCache,
      "birthdayGreeterSend",
      "Birthday Greeter"
    );
  }

  @Process(JobConstants.JOBS.BIRTHDAY_GREETER_SEND)
  async run(job: Job<IPeriodicMailSend>) {
    await super.run(job);
  }

  protected async sendEmail(data: User): Promise<boolean> {
    const { mailProviderUrl } = this.configService.get("birthdayGreeterSend");
    const params = {
      // in the test doesn't say to keep the email.
      // and since it is not sending a real email, I keep it hardcoded.
      email: "test@digitalenvision.com.au",
      message: `Hey, ${data.firstName} it’s your birthday.`,
    };

    const response = await this.httpService.post(mailProviderUrl, params, {
      headers: { "content-type": "application/json" },
    });

    return response?.data?.status === "sent";
  }

  protected async pushRetryJob(jobId: string): Promise<void> {
    const { retryDelay } = this.configService.get("birthdayGreeterSend");
    const delay = retryDelay * 1000;
    this.logger.error(
      `Failed to send birtday greeter to some users. Pushing the same job to retry the failed process with delay: ${retryDelay} seconds`,
      jobId
    );
    await this.birthdayGreeterSendProducer.enqueue(
      { originalJobId: jobId },
      {
        delay,
      }
    );
  }

  protected getRetryPeriod(): number {
    const { retryPeriod } = this.configService.get("birthdayGreeterSend");
    return retryPeriod;
  }

  protected getDbQueryOptions(
    scheduledSendTime: string,
    serverSendTime: string
  ): FindOptions {
    return {
      where: {
        [Op.and]: [
          literal(
            `DATE_FORMAT(DATE_ADD(birthDate, INTERVAL '${scheduledSendTime}' HOUR_MINUTE), '%m-%d %H:%i') = DATE_FORMAT(CONVERT_TZ('${serverSendTime}', '+00:00', location), '%m-%d %H:%i') `
          ),
        ],
      },
    };
  }
}
