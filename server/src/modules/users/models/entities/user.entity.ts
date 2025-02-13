import { Table, Column, DataType, AllowNull } from "sequelize-typescript";
import { BaseEntity } from "src/common/base/base.entity";

@Table({ tableName: "users", timestamps: false })
export class User extends BaseEntity {
  @AllowNull(false)
  @Column({ type: DataType.STRING })
  firstName: string;

  @Column({ type: DataType.STRING })
  lastName: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  location: string;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  birthDate: Date;
}
