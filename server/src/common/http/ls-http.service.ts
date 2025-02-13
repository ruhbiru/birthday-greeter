import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { ILsRequestOptions } from './ls-request-options.interface';
import { ILsHttpResponse } from './ls-http.response.interface';
import { ProxyAgent } from 'proxy-agent';

@Injectable()
export class LsHttpService {
  proxyAgent = new ProxyAgent();

  constructor(private httpService: HttpService) {}

  async request<T = any>(
    options: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.request<T>(this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  async get<T = any>(
    url: string,
    options?: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.get<T>(url, this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  async delete<T = any>(
    url: string,
    options?: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.delete<T>(url, this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  async head<T = any>(
    url: string,
    options?: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.head<T>(url, this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  async post<T = any>(
    url: string,
    data?: any,
    options?: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.post<T>(url, data, this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  async put<T = any>(
    url: string,
    data?: any,
    options?: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.put<T>(url, data, this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    options?: ILsRequestOptions,
  ): Promise<ILsHttpResponse<T>> {
    const response = await lastValueFrom(
      this.httpService.patch<T>(url, data, this.setUpProxy(options)),
    );
    return this.mapResponse<T>(response);
  }

  private setUpProxy(options?: ILsRequestOptions) {
    options = options ?? {};
    // axios does not support tunnelling HTTPS traffic to a HTTP proxy
    // (https://github.com/axios/axios/issues/658)
    // so the only option we are left with, is disabling axios proxy
    // functionalities (by default, it will set up a proxy if either one
    // of HTTP_PROXY or HTTPS_PROXY environment variables is set), and
    // install a custom http agent instead...one capable of doing HTTPS
    // tunnelling (see: https://github.com/axios/axios/issues/4531#issuecomment-1081264893)
    options.proxy = false;
    options.httpAgent = this.proxyAgent;
    options.httpsAgent = this.proxyAgent;
    return options;
  }

  private mapResponse<T>(response: AxiosResponse): ILsHttpResponse<T> {
    return {
      data: response.data,
      statusCode: response.status,
      headers: response.headers,
    };
  }
}
