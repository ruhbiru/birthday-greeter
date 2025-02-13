import * as Redis from "ioredis";
import { ConfigService } from "@nestjs/config";

export const CACHE_CLIENT = "CacheClient";
export const CacheClient = {
  provide: CACHE_CLIENT,
  useFactory: (configService: ConfigService) => {
    const redisConfig = configService.get("redis");

    return new Redis(redisConfig);
  },
  inject: [ConfigService],
};
