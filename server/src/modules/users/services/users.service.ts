import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import * as moment from "moment";
import { randomUUID as uuidv4 } from "node:crypto";

import { User } from "../models/entities/user.entity";
import { IUser } from "../interfaces/user.interface";
import { forEach, isEmpty, isNil } from "lodash";
import { ValidationException } from "src/common/validations/validation.exception";
import { CountOptions, FindOptions, Transaction } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly model: typeof User,
    private readonly sequelize: Sequelize
  ) {}

  create(user: IUser) {
    // to make sure it doesn't save the time
    user.birthDate = this.removeTime(user.birthDate);

    const txnTime = moment.utc().toDate();

    let entity = this.mapToEntity(user);
    entity = this.setNewEntityProperties(entity, txnTime);

    return entity.save({ fields: this.getModelProperties() });
  }

  update(user: IUser) {
    // to make sure it doesn't save the time
    user.birthDate = this.removeTime(user.birthDate);

    const txnTime = moment.utc().toDate();
    return this.sequelize.transaction(async (txn) => {
      const existingUser = await this.getValidEntityById(user.id, txn);
      const fields = this.getModelProperties();

      existingUser.editedDate = txnTime;
      this.updateProperties(existingUser, user, fields);

      return await existingUser.save({
        transaction: txn,
        fields,
      });
    });
  }

  async delete(id: string) {
    await this.model.destroy({ where: { entityId: id } });
  }

  async findAll(options?: FindOptions, txn?: Transaction) {
    options.transaction = txn;
    try {
      return await this.model.findAll(options);
    } catch (err) {
      console.log("error", err);
    }
  }

  async count(options?: CountOptions, txn?: Transaction): Promise<number> {
    options.transaction = txn;
    return this.model.count(options);
  }

  async getValidEntityById(id: string, txn?: Transaction) {
    if (isEmpty(id)) {
      throw new ValidationException("User's id");
    }
    return this.getValidEntity({ where: { entityId: id } }, txn);
  }

  async getValidEntity(options?: FindOptions, txn?: Transaction) {
    if (isEmpty(options?.where)) {
      throw new ValidationException("User not found");
    }

    const entity = await this.findOne(options, txn);

    if (isNil(entity)) {
      throw new ValidationException("User not found");
    }
    return entity;
  }

  /**
   * find an entity
   */
  async findOne(options: FindOptions, txn?: Transaction) {
    options.transaction = txn;
    return await this.model.findOne(options);
  }

  private removeTime(date: Date) {
    return new Date(moment(date).format("YYYY-MM-DD"));
  }

  private getModelProperties() {
    return Object.keys(this.model.getAttributes());
  }

  private setNewEntityProperties(entity: User, txnTime: Date) {
    entity.entityId = entity.entityId || uuidv4();
    entity.createdDate = txnTime;
    entity.editedDate = txnTime;
    return entity;
  }

  private mapToEntity(
    data: any,
    existingEntity?: any,
    properties?: string[]
  ): User {
    if (existingEntity) {
      return this.updateProperties(existingEntity, data, properties);
    }
    return this.model.build(data);
  }

  private updateProperties(
    targetEntity: any,
    sourceEntity: any,
    properties?: string[]
  ) {
    const internalProps = ["entityId", "createdDate", "editedDate"];

    const modelProperties = this.model.getAttributes();
    const modelPropertyNames = Object.keys(modelProperties);

    if (isEmpty(properties)) {
      properties = modelPropertyNames;
    }

    forEach(properties, (property) => {
      if (!internalProps.includes(property)) {
        targetEntity[property] = isNil(sourceEntity[property])
          ? null
          : sourceEntity[property];
      }
    });
    return targetEntity;
  }
}
