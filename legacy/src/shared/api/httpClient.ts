import axios from 'axios';
import Cookies from 'js-cookie';

import { USER_TOKEN_COOKIE } from '@/shared/const/UI';
import {
  getBaseUrl,
  getProxyUrl,
  type ApiVersion,
} from '@/shared/utils/getApiUrl';
import { useIsDev } from '@/shared/utils/isDev';

import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

declare module 'axios' {
  // Internal marker used to prevent an infinite refresh/retry cycle.
  interface InternalAxiosRequestConfig {
    _retryAfterRefresh?: boolean;
  }
}

type AuthResponse = {
  accessToken: string;
};

export type RequestConfig = {
  url: AxiosRequestConfig['url'];
  payload?: AxiosRequestConfig['params'] | AxiosRequestConfig['data'];
  signal?: AbortSignal;
  version?: ApiVersion;
  baseUrl?: string;
  headers?: AxiosRequestConfig['headers'];
};

class HttpClient {
  readonly instance: AxiosInstance;

  private refreshRequest: Promise<string> | null = null;

  private authFailureHandler?: () => Promise<void> | void;

  private readonly isDev = useIsDev();

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

      if (this.isDev && Cookies.get(USER_TOKEN_COOKIE)) {
        // eslint-disable-next-line no-param-reassign
        req.headers.Authorization = `Bearer ${Cookies.get(USER_TOKEN_COOKIE)}`;
      }

      return req;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const request = error.config;
        const isUnauthorized = error.response?.status === 401;
        const isRefreshRequest = request?.url?.endsWith('/auth/refresh');
        const isSignInRequest = request?.url?.endsWith('/auth/signin');

        if (
          !isUnauthorized ||
          !request ||
          request._retryAfterRefresh ||
          isRefreshRequest ||
          isSignInRequest
        ) {
          if (isUnauthorized && !isSignInRequest) {
            await this.authFailureHandler?.();
          }

          return Promise.reject(error);
        }

        request._retryAfterRefresh = true;

        try {
          if (!this.refreshRequest) {
            this.refreshRequest = this.instance
              .post<AuthResponse>('/auth/refresh')
              .then(({ data }) => {
                this.saveAccessToken(data.accessToken);

                return data.accessToken;
              })
              .finally(() => {
                this.refreshRequest = null;
              });
          }

          const accessToken = await this.refreshRequest;

          if (this.isDev) {
            request.headers.Authorization = `Bearer ${accessToken}`;
          }

          return this.instance(request);
        } catch (refreshError) {
          await this.authFailureHandler?.();

          return Promise.reject(refreshError);
        }
      },
    );
  }

  setAuthFailureHandler(handler: () => Promise<void> | void) {
    this.authFailureHandler = handler;
  }

  saveAccessToken(accessToken: string) {
    if (this.isDev) {
      Cookies.set(USER_TOKEN_COOKIE, accessToken, { expires: 365 });
    }

    Cookies.set('ttg-user-token', accessToken, { expires: 365 });
  }

  get<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'get',
      url: config.url,
      params: config.payload,
      signal: config.signal,
      headers: config.headers,
      baseURL: config.baseUrl ?? getBaseUrl(config.version),
    });
  }

  post<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'post',
      url: config.url,
      data: config.payload,
      signal: config.signal,
      headers: config.headers,
      baseURL: config.baseUrl ?? getBaseUrl(config.version),
    });
  }

  put<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'put',
      url: config.url,
      data: config.payload,
      signal: config.signal,
      headers: config.headers,
      baseURL: config.baseUrl ?? getBaseUrl(config.version),
    });
  }

  patch<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'patch',
      url: config.url,
      data: config.payload,
      signal: config.signal,
      headers: config.headers,
      baseURL: config.baseUrl ?? getBaseUrl(config.version),
    });
  }

  delete<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'delete',
      url: config.url,
      params: config.payload,
      signal: config.signal,
      headers: config.headers,
      baseURL: config.baseUrl ?? getBaseUrl(config.version),
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
