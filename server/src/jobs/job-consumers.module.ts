import { Module } from "@nestjs/common";
import { BirthdayGreeterSendConsumerModule } from "./birthday-greeter-send/birthday-greeter-send.comsumer.module";

@Module({
  imports: [BirthdayGreeterSendConsumerModule],
  exports: [BirthdayGreeterSendConsumerModule],
})
export class JobConsumersModule {}
