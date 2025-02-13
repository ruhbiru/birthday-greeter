import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { JobConstants } from "../job.constants";
import { BirthdayGreeterSendProducer } from "./birthday-greeter-send.producer";
import { ConfigModule } from "src/config/config.module";

@Module({
  imports: [
    BullModule.registerQueue({
      name: JobConstants.JOBS.BIRTHDAY_GREETER_SEND,
    }),
    ConfigModule,
  ],
  providers: [BirthdayGreeterSendProducer],
  exports: [BullModule, BirthdayGreeterSendProducer],
})
export class BirthdayGreeterSendProducerModule {}
