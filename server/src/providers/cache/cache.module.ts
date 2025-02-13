import { Module } from "@nestjs/common";
import { LoggerModule } from "src/common/logger/logger.module";
import { CacheClient } from "./cache-client";

@Module({
  imports: [LoggerModule],
  providers: [CacheClient],
  exports: [CacheClient],
})
export class CacheModule {}
