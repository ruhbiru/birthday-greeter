import { Injectable } from "@nestjs/common";
import { BasicCache } from "src/providers/cache/basic.cache";
import {
  ICheckpoint,
  IRawCheckpoint,
} from "../../birthday-greeter-send/interfaces/checkpoint.interfaces";

export abstract class PeriodicMailSenderCheckpointCache extends BasicCache {
  constructor(moduleName: string) {
    super(moduleName, "checkpoint");
  }

  async getCheckpoint(jobId: string): Promise<ICheckpoint> {
    try {
      const checkpoint = await super.get<IRawCheckpoint>(jobId);
      if (checkpoint) {
        return {
          ...checkpoint,
          failedIds: new Set(checkpoint.failedIds || []),
        };
      }
      return;
    } catch (error) {
      // Log the error but don't stop the main process
      this.logger.error(`Failed to get reindexing progress (${jobId})`, error);
      return;
    }
  }

  async setCheckpoint(checkpoint: ICheckpoint, jobId: string) {
    try {
      /**
       * it's a magic number with an assumption
       * that the birthday greeter jobs should have completed / reached the max retry
       */
      const ttl = 3600; // in seconds -- 1 hours
      await super.setWithExpiry(
        { ...checkpoint, failedIds: Array.from(checkpoint.failedIds || []) },
        ttl,
        jobId
      );
    } catch (error) {
      // Log the error but don't stop the main process
      this.logger.error(
        `Failed to set birthday greeter checkpoint (${jobId})`,
        error
      );
    }
  }

  async deleteCheckpoint(jobId: string) {
    try {
      await super.del(jobId);
    } catch (error) {
      // Log the error but don't stop the main process
      this.logger.error(
        `Failed to delete reindexing progress (${jobId})`,
        error
      );
    }
  }
}
