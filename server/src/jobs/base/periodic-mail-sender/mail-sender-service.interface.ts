import { CountOptions, FindOptions } from "sequelize";

export interface IMailSenderService<M> {
  findAll(options?: FindOptions): Promise<M[]>;
  count(options?: CountOptions): Promise<number>;
}
