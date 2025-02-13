import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ApiModule } from "./api.module";
import { ValidationFilter } from "./common/validations/validation.filter";
import { ConfigModule } from "./config/config.module";
import { LsLogger } from "./common/logger/ls.logger";
import { AllExceptionsFilter } from "./common/filters/all-exception.filter";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RequestLoggingMiddleware } from "./common/request-logging.middleware";

import { CacheModule } from "./providers/cache/cache.module";
import { SCHEDULER_JOB_PRODUCERS } from "./jobs/job-producers.module";
import { IJob } from "./jobs/job.interface";

@Module({
  imports: [ConfigModule, ApiModule, CacheModule],
})
class WebModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(WebModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix("api");
  app.useLogger(app.get(LsLogger));

  app.useGlobalFilters(
    app.get(AllExceptionsFilter),
    app.get(HttpExceptionFilter),
    app.get(ValidationFilter)
  );

  app.useGlobalPipes(app.get("VALIDATION_PIPE"));

  /*
   * A Bulljs job can be enqueued / triggered from both consoles and API.
   * Ideally we should initialize two different containers for the API and scheduler.
   * But to simplify the assessment process, currently, we only have single container (API server)
   * which also run as **SCHEDULER** (responsible to run all the schedulers).
   * ToDo:
   * So, once we have dedicated container which run as a scheduler, then we should move the logic below to the other *.main.ts
   */
  const isJobsManager = true;
  if (isJobsManager) {
    const schedulerJobProducers: IJob[] = app.get(SCHEDULER_JOB_PRODUCERS);
    for (const producer of schedulerJobProducers) {
      await producer.schedulerInit();
    }
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SDT APIs")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document, {
    swaggerOptions: {
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  await app.listen(7000);
}
bootstrap();
