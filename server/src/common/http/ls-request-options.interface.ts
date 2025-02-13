import { AxiosBasicCredentials, AxiosProxyConfig } from 'axios';
import { LsRequestMethod } from './ls-request-method';

export interface ILsRequestOptions {
  url?: string;
  method?: LsRequestMethod;
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  timeout?: number;
  timeoutErrorMessage?: string;
  maxContentLength?: number;
  auth?: AxiosBasicCredentials;
  proxy?: AxiosProxyConfig | false;
  httpAgent?: any;
  httpsAgent?: any;
}
