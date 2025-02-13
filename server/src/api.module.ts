import { Module } from "@nestjs/common";
import { CoreModule } from "./modules/core.module";
import { ProvidersModule } from "./providers/providers.module";
import { JobProducersModule } from "src/jobs/job-producers.module";
import { JobConsumersModule } from "src/jobs/job-consumers.module";
import { ConfigModule } from "./config/config.module";
import { FiltersModule } from "./common/filters/filters.module";
import { ValidationsModule } from "./common/validations/validations.module";

@Module({
  imports: [
    ValidationsModule,
    ConfigModule,
    FiltersModule,
    CoreModule,
    JobProducersModule,
    JobConsumersModule,
    ProvidersModule,
  ],
})
export class ApiModule {}
