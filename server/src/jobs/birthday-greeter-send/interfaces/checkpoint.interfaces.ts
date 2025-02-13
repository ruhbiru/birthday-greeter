export interface IBaseCheckpoint {
  originalJobId: string;
  runningSince: Date;
  isFirstTimeRunning?: boolean;
  serverSendTime?: string;
  scheduledSendTime?: string;
  totalIds?: number;
  totalGreetedIds?: number;

  complete: boolean;
  lastId?: string;
  lastEditedDate?: Date;
}

export interface ICheckpoint extends IBaseCheckpoint {
  failedIds: Set<string>;
}

export interface IRawCheckpoint extends IBaseCheckpoint {
  failedIds: string[];
}
