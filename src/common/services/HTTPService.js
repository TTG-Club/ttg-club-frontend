import axios from 'axios';
import Cookies from 'js-cookie';
import { USER_TOKEN_COOKIE } from '@/common/const/UI';
import { useUserStore } from '@/store/UI/UserStore';

export default class HTTPService {
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

    get(url, params) {
        const config = {
            url,
            params,
            method: 'get'
        };

        return this.instance(config);
    }

    post(url, data, signal = new AbortController().signal) {
        const config = {
            url,
            data,
            signal,
            method: 'post'
        };

        return this.instance(config);
    }

    put(url, data, signal = new AbortController().signal) {
        const config = {
            url,
            data,
            signal,
            method: 'put'
        };

        return this.instance(config);
    }

    patch(url, data, signal = new AbortController().signal) {
        const config = {
            url,
            data,
            signal,
            method: 'patch'
        };

        return this.instance(config);
    }

    delete(url, data, signal = new AbortController().signal) {
        const config = {
            url,
            data,
            signal,
            method: 'delete'
        };

        return this.instance(config);
    }

    rawGet(url, params) {
        return this.instanceRaw({
            url,
            params,
            method: 'get'
        });
    }
}
