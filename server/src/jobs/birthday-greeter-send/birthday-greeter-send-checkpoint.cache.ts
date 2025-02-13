import { Injectable } from "@nestjs/common";
import { PeriodicMailSenderCheckpointCache } from "../base/periodic-mail-sender/periodic-mail-sender-checkpoint.cache";

@Injectable()
export class BirthdayGreeterSendCheckpointCache extends PeriodicMailSenderCheckpointCache {
  constructor() {
    super("birthday-greeter");
  }
}
