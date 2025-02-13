import { Module } from "@nestjs/common";
import { CacheModule } from "./cache/cache.module";
import { DatabaseModule } from "./database/database.module";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [DatabaseModule, QueueModule, CacheModule],
  exports: [DatabaseModule, QueueModule, CacheModule],
})
export class ProvidersModule {}
