import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigService } from "@nestjs/config";
import { User } from "src/modules/users/models/entities/user.entity";

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get("db");
        return {
          dialect: dbConfig.dialect,
          dialectOptions: dbConfig.dialectOptions,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          autoLoadModels: false,
          models: [User],
          synchronize: false,
          logging: dbConfig.logging,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
