import * as _ from "lodash";
import { Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { LsLogger } from "src/common/logger/ls.logger";
import { CACHE_CLIENT } from "./cache-client";

@Injectable()
export class BasicCache {
  @Inject(CACHE_CLIENT)
  protected cacheClient: Redis;
  protected logger: LsLogger;
  constructor(protected scope: string, protected entityType: string) {
    this.logger = new LsLogger(this.constructor.name);
  }

  async get<T>(...keys: string[]): Promise<T> {
    const value = await this.cacheClient.get(this.getCompleteKey(...keys));
    return JSON.parse(value);
  }

  async set(value: any, ...keys: string[]) {
    await this.cacheClient.set(
      this.getCompleteKey(...keys),
      JSON.stringify(value)
    );
  }

  async setByPartialKeys(mutation, ...partialKeys: string[]) {
    const prefix = this.getCompleteKey(...partialKeys);
    const stream = this.cacheClient.scanStream({
      // only returns keys following the pattern of "prefix"
      match: `${prefix}:*`,
      // returns approximately 100 elements per call
      count: 100,
    });

    return new Promise((fulfill, reject) => {
      const keys = [];
      stream.on("data", function (resultKeys) {
        keys.push(...resultKeys);
      });

      stream.on("error", reject);

      stream.on("end", async () => {
        if (!keys.length) {
          return fulfill([]);
        }

        let firstError = null;
        for (const key of keys) {
          try {
            let value = await this.cacheClient.get(key);
            value = mutation(JSON.parse(value));
            await this.cacheClient.set(key, JSON.stringify(value));
          } catch (error) {
            if (!firstError) firstError = error;
            this.logger.error(`Unable to update session: ${key}`, error);
          }
        }
        if (firstError) reject(firstError);
        fulfill(keys);
      });
    });
  }

  // ttl: the number of seconds that data will last in storage
  async setWithExpiry(value: any, ttl?: number | string, ...keys: string[]) {
    await this.cacheClient.set(
      this.getCompleteKey(...keys),
      JSON.stringify(value),
      "EX",
      ttl
    );
  }

  del(...keys: string[]) {
    return this.cacheClient.del(this.getCompleteKey(...keys));
  }

  async deleteByPartialKeys(...partialKeys: string[]) {
    const prefix = this.getCompleteKey(...partialKeys);
    return new Promise((resolve, reject) => {
      try {
        const stream = this.cacheClient.scanStream({
          // only returns keys following the pattern of "prefix"
          match: `${prefix}:*`,
          // returns approximately 100 elements per call
          count: 100,
        });

        const keys = [];
        const cacheClient = this.cacheClient;

        stream.on("data", function (resultKeys) {
          // `resultKeys` is an array of strings representing key names
          keys.push(...resultKeys);
        });
        stream.on("end", async function () {
          if (keys.length) {
            resolve(await cacheClient.unlink(keys));
          } else {
            resolve(0);
          }
        });
      } catch (error) {
        this.logger.error(
          `Failed to clean cache by prefix: "${prefix}".`,
          error
        );
        reject(error);
      }
    });
  }

  protected getCompleteKey(...partialKeys: string[]): string {
    return `${this.scope}:${this.entityType}:${_.join(partialKeys, ":")}`;
  }
}
