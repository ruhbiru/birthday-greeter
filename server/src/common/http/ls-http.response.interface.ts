export interface ILsHttpResponse<T = unknown> {
  data: T;
  statusCode: number;
  headers: any;
}
