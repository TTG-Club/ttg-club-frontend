import type {
  AxiosInstance, AxiosRequestConfig, AxiosResponse
} from 'axios';
import axios from 'axios';
import Cookies from 'js-cookie';
import { USER_TOKEN_COOKIE } from '@/common/const/UI';
import { useUserStore } from '@/store/UI/UserStore';

export type RequestConfig = {
  url: AxiosRequestConfig['url'],
  payload?: AxiosRequestConfig['params'] | AxiosRequestConfig['data'],
  signal?: AbortSignal
}

export default class HTTPService {
  protected instance: AxiosInstance;

  constructor() {
    axios.defaults.withCredentials = true;

    this.instance = axios.create({
      baseURL: this.getBaseURL('/api/v1'),
      withCredentials: true,
      headers: {}
    });

    this.instance.interceptors.request.use(req => {
      if (Cookies.get(USER_TOKEN_COOKIE)) {
        // eslint-disable-next-line no-param-reassign
        req.headers.Authorization = `Bearer ${ Cookies.get(USER_TOKEN_COOKIE) }`;
      }

      return req;
    });

    this.instance.interceptors.response.use(async resp => {
      if (resp.status === 401) {
        const userStore = useUserStore();

        await userStore.clearUser();
      }

      return resp;
    });
  }

  get<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'get',
      url: config.url,
      params: config.payload,
      signal: config.signal
    });
  }

  post<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'post',
      url: config.url,
      data: config.payload,
      signal: config.signal
    });
  }

  put<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'put',
      url: config.url,
      data: config.payload,
      signal: config.signal
    });
  }

  patch<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'patch',
      url: config.url,
      data: config.payload,
      signal: config.signal
    });
  }

  delete<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'delete',
      url: config.url,
      data: config.payload,
      signal: config.signal
    });
  }

  rawHead(config: Omit<RequestConfig, 'payload'>) {
    return this.instance({
      method: 'head',
      baseURL: this.getBaseURL(),
      url: config.url,
      signal: config.signal
    });
  }

  rawGet(config: RequestConfig): Promise<AxiosResponse<string>> {
    return this.instance({
      method: 'get',
      baseURL: this.getBaseURL(),
      url: config.url,
      params: config.payload,
      signal: config.signal
    });
  }

  private getBaseURL = (url = '') => {
    const devPrefix = import.meta.env.DEV ? '/proxy' : '';

    return `${ devPrefix }${ url }`;
  };
}
