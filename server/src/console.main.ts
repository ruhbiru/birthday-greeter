import { NestFactory } from "@nestjs/core";
import { CommandRunnerModule, CommandRunnerService } from "nest-commander";
import { ConsolesModule } from "./consoles.module";
import { LsLogger } from "./common/logger/ls.logger";

async function bootstrap() {
  // What we are doing here, is pretty much what nest-commander would do,
  // if you were to call CommandFactory directly.  So why aren't we
  // calling CommandFactory directly, you might ask? Well, because we
  // want to use our custom logger, but the library only allows you to
  // overwrite it only before calling `CommandFactory.run()`; but we
  // actually need to start Nest.js before we can get an instance of
  // CnLogger; hence, we completely bypass the initialization steps and
  // wire things up manually.
  const commandRunnerModule = CommandRunnerModule.forModule(ConsolesModule, {
    usePlugins: false,
    cliName: "sdt-commander",
  });
  const app = await NestFactory.createApplicationContext(commandRunnerModule, {
    bufferLogs: true,
  });

  const logger = app.get(LsLogger);
  app.useLogger(logger);
  app.flushLogs(); // https://github.com/nestjs/nest/issues/8733

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
    process.exit(1);
  });

  try {
    await app.get(CommandRunnerService).run();
    await app.close();
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}
bootstrap();
