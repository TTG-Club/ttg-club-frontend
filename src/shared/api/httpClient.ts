import axios from 'axios';
import Cookies from 'js-cookie';

import { USER_TOKEN_COOKIE } from '@/shared/const/UI';
import {
  getBaseUrl,
  getProxyUrl,
  type ApiVersion,
} from '@/shared/utils/getApiUrl';

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export type RequestConfig = {
  url: AxiosRequestConfig['url'];
  payload?: AxiosRequestConfig['params'] | AxiosRequestConfig['data'];
  signal?: AbortSignal;
  version?: ApiVersion;
};

class HttpClient {
  readonly instance: AxiosInstance;

  constructor() {
    axios.defaults.withCredentials = true;

    this.instance = axios.create({
      baseURL: getBaseUrl(),
      withCredentials: true,
      headers: {},
    });

    this.instance.interceptors.request.use((req) => {
      // eslint-disable-next-line no-param-reassign
      req.paramsSerializer = {
        indexes: null,
      };

      if (Cookies.get(USER_TOKEN_COOKIE)) {
        // eslint-disable-next-line no-param-reassign
        req.headers.Authorization = `Bearer ${Cookies.get(USER_TOKEN_COOKIE)}`;
      }

      return req;
    });
  }

  get<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'get',
      url: config.url,
      params: config.payload,
      signal: config.signal,
      baseURL: getBaseUrl(config.version),
    });
  }

  post<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'post',
      url: config.url,
      data: config.payload,
      signal: config.signal,
      baseURL: getBaseUrl(config.version),
    });
  }

  put<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'put',
      url: config.url,
      data: config.payload,
      signal: config.signal,
      baseURL: getBaseUrl(config.version),
    });
  }

  patch<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'patch',
      url: config.url,
      data: config.payload,
      signal: config.signal,
      baseURL: getBaseUrl(config.version),
    });
  }

  delete<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'delete',
      url: config.url,
      params: config.payload,
      signal: config.signal,
      baseURL: getBaseUrl(config.version),
    });
  }

  rawHead(config: Omit<RequestConfig, 'payload'>) {
    return this.instance({
      method: 'head',
      baseURL: getProxyUrl(),
      url: config.url,
      signal: config.signal,
    });
  }

  rawGet(config: RequestConfig): Promise<AxiosResponse<string>> {
    return this.instance({
      method: 'get',
      baseURL: getProxyUrl(),
      url: config.url,
      params: config.payload,
      signal: config.signal,
    });
  }
}

export const httpClient = new HttpClient();
