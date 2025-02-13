import { LsLogger } from "../logger/ls.logger";

export abstract class BaseControl {
  protected logger: LsLogger;
  constructor() {
    this.logger = new LsLogger(this.constructor.name);
  }
}
