import type { AxiosInstance, AxiosRequestConfig } from 'axios';
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

    protected instanceRaw: AxiosInstance;

    constructor() {
        axios.defaults.withCredentials = true;

        this.instance = axios.create({
            baseURL: '/api/v1',
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

        this.instanceRaw = axios.create({
            baseURL: '',
            withCredentials: true
        });
    }

    get(config: RequestConfig) {
        return this.instance({
            method: 'get',
            url: config.url,
            params: config.payload,
            signal: config.signal
        });
    }

    post(config: RequestConfig) {
        return this.instance({
            method: 'post',
            url: config.url,
            data: config.payload,
            signal: config.signal
        });
    }

    put(config: RequestConfig) {
        return this.instance({
            method: 'put',
            url: config.url,
            data: config.payload,
            signal: config.signal
        });
    }

    patch(config: RequestConfig) {
        return this.instance({
            method: 'patch',
            url: config.url,
            data: config.payload,
            signal: config.signal
        });
    }

    delete(config: RequestConfig) {
        return this.instance({
            method: 'delete',
            url: config.url,
            data: config.payload,
            signal: config.signal
        });
    }

    rawGet(config: RequestConfig) {
        return this.instanceRaw({
            method: 'get',
            url: config.url,
            params: config.payload,
            signal: config.signal
        });
    }
}
