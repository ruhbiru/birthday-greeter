import {
  AfterFind,
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
} from "sequelize-typescript";

export class BaseEntity extends Model<any, any> {
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  entityId: string;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  createdDate: Date;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  editedDate: Date;
}
