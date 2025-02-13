import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { JobConstants } from "../job.constants";
import { BirthdayGreeterSendConsumer } from "./birthday-greeter-send.consumer";
import { UsersModule } from "src/modules/users/users.module";
import { CacheModule } from "src/providers/cache/cache.module";
import { LsHttpModule } from "src/common/http/ls-http.module";
import { BirthdayGreeterSendProducerModule } from "./birthday-greeter-send.producer.module";
import { BirthdayGreeterSendCheckpointCache } from "./birthday-greeter-send-checkpoint.cache";

@Module({
  imports: [
    BullModule.registerQueue({
      name: JobConstants.JOBS.BIRTHDAY_GREETER_SEND,
    }),
    CacheModule,
    UsersModule,
    LsHttpModule,
    BirthdayGreeterSendProducerModule,
  ],
  providers: [BirthdayGreeterSendCheckpointCache, BirthdayGreeterSendConsumer],
  exports: [BullModule, BirthdayGreeterSendConsumer],
})
export class BirthdayGreeterSendConsumerModule {}
