import { Module } from "@nestjs/common";
import { BirthdayGreeterSendProducerModule } from "./birthday-greeter-send/birthday-greeter-send.producer.module";
import { BirthdayGreeterSendProducer } from "./birthday-greeter-send/birthday-greeter-send.producer";

export const SCHEDULER_JOB_PRODUCERS = Symbol("SCHEDULER_JOB_PRODUCERS");

@Module({
  imports: [BirthdayGreeterSendProducerModule],
  providers: [
    {
      provide: SCHEDULER_JOB_PRODUCERS,
      useFactory: (
        birthdayGreeterSendProducer: BirthdayGreeterSendProducer
      ) => {
        return [birthdayGreeterSendProducer];
      },
      inject: [BirthdayGreeterSendProducer],
    },
  ],
  exports: [BirthdayGreeterSendProducerModule],
})
export class JobProducersModule {}
