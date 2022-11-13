import {
    getCurrentInstance, inject, provide
} from 'vue';
import HTTPService from '@/common/services/HTTPService';

const axiosInjectionKey = Symbol('axios');
const http = new HTTPService();

const provideAxios = () => {
    if (getCurrentInstance()) {
        provide(axiosInjectionKey, http);
    }
};

export const useAxios = () => {
    if (!getCurrentInstance()) {
        return http;
    }

    if (!inject(axiosInjectionKey, undefined)) {
        provideAxios();
    }

    return inject(axiosInjectionKey, http);
};
