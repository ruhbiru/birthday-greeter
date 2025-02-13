import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { ConfigService } from "@nestjs/config";
import * as winston from "winston";
import { LsLogger } from "./ls.logger";

const getLoggerFormat = function (config) {
  const loggerFormat = [];
  if (config.colorize === true) {
    loggerFormat.push(winston.format.colorize());
  }
  if (config.timestamp === true) {
    loggerFormat.push(winston.format.timestamp());
  }
  if (config.json === true) {
    loggerFormat.push(winston.format.json());
  } else {
    loggerFormat.push(winston.format.simple());
  }
  return loggerFormat;
};

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        // for now, we only use console transport
        const loggerConfig = configService.get("logger").console;

        return {
          transports: [
            new winston.transports.Console({
              level: loggerConfig.level || "error",
              handleExceptions: false,
              format: winston.format.combine(...getLoggerFormat(loggerConfig)),
            }),
            // other transports...
          ],
          // other options
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [LsLogger],
  exports: [LsLogger],
})
export class LoggerModule {}
