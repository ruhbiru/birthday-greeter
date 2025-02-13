import { Command, CommandRunner, Option } from "nest-commander";
import * as moment from "moment";
import { BirthdayGreeterSendProducer } from "./jobs/birthday-greeter-send/birthday-greeter-send.producer";

@Command({ name: "birthday-greeter-send" })
export class BirthDayGreeterSendConsole extends CommandRunner {
  constructor(
    private readonly birthDayGreeterSendProducer: BirthdayGreeterSendProducer
  ) {
    super();
  }

  @Option({
    flags: "--serverSendTime [serverSendTime]",
  })
  parseServerSendTime(serverSendTime: string) {
    return serverSendTime;
  }

  async run(_, args: { serverSendTime: string }) {
    const { serverSendTime: serverSendTimeString } = args;
    const serverSendTime = this.getValidserverSendTime(serverSendTimeString);
    await this.birthDayGreeterSendProducer.enqueue({ serverSendTime });
  }

  private getValidserverSendTime(serverSendTime: string) {
    if (!serverSendTime) {
      return this.roundDownTo15Minutes(moment.utc()).format(
        "YYYY-MM-DD HH:mm:00"
      );
    }

    const serverSendTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/;
    if (serverSendTimePattern.test(serverSendTime)) {
      return this.roundDownTo15Minutes(moment.utc(serverSendTime)).format(
        "YYYY-MM-DD HH:00:00"
      );
    }
    console.error(
      "Invalid serverSendTime. Please provide a valid serverSendTime in the format 'YYYY-MM-DD HH:00:00'."
    );
    throw new Error(
      "Invalid serverSendTime. Please provide a valid serverSendTime in the format 'YYYY-MM-DD HH:00:00'."
    );
  }

  private roundDownTo15Minutes(moment: moment.Moment) {
    const minutes = moment.minutes();
    const roundedMinutes = Math.floor(minutes / 15) * 15;
    return moment.minutes(roundedMinutes).seconds(0).milliseconds(0);
  }
}
