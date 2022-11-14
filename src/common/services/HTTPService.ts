import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import Cookies from 'js-cookie';
import { USER_TOKEN_COOKIE } from '@/common/const/UI';
import { useUserStore } from '@/store/UI/UserStore';

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
                req.headers = {
                    ...req.headers,
                    Authorization: `Bearer ${ Cookies.get(USER_TOKEN_COOKIE) }`
                };
            }

            return req;
        });

        this.instance.interceptors.response.use(resp => {
            if (resp.status === 401) {
                const userStore = useUserStore();

                userStore.clearUser();
            }

            return resp;
        });

        this.instanceRaw = axios.create({
            baseURL: '',
            withCredentials: true
        });
    }

    get(url: AxiosRequestConfig['url'], params?: AxiosRequestConfig['params']) {
        return this.instance({
            url,
            params,
            method: 'get'
        });
    }

    post(url: AxiosRequestConfig['url'], data?: AxiosRequestConfig['data'], signal = new AbortController().signal) {
        return this.instance({
            url,
            data,
            signal,
            method: 'post'
        });
    }

    put(url: AxiosRequestConfig['url'], data?: AxiosRequestConfig['data'], signal = new AbortController().signal) {
        return this.instance({
            url,
            data,
            signal,
            method: 'put'
        });
    }

    patch(url: AxiosRequestConfig['url'], data?: AxiosRequestConfig['data'], signal = new AbortController().signal) {
        return this.instance({
            url,
            data,
            signal,
            method: 'patch'
        });
    }

    delete(url: AxiosRequestConfig['url'], data?: AxiosRequestConfig['data'], signal = new AbortController().signal) {
        return this.instance({
            url,
            data,
            signal,
            method: 'delete'
        });
    }

    rawGet(url: AxiosRequestConfig['url'], params?: AxiosRequestConfig['params']) {
        return this.instanceRaw({
            url,
            params,
            method: 'get'
        });
    }
}
