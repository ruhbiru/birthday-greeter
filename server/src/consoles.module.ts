import { Module } from "@nestjs/common";
import { JobProducersModule } from "./jobs/job-producers.module";
import { BirthDayGreeterSendConsole } from "./birthday-greeter-send.console";
import { LoggerModule } from "./common/logger/logger.module";
import { ConfigModule } from "./config/config.module";
import { ProvidersModule } from "./providers/providers.module";
import { CoreModule } from "./modules/core.module";
@Module({
  imports: [
    ConfigModule,
    CoreModule,
    LoggerModule,
    JobProducersModule,
    ProvidersModule,
  ],
  providers: [BirthDayGreeterSendConsole],
})
export class ConsolesModule {}
