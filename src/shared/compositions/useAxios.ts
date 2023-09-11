import { getCurrentInstance, inject, provide } from 'vue';

import HTTPService from '@/shared/services/HTTPService';

import type { InjectionKey } from 'vue';

const axiosInjectionKey = Symbol('axios') as InjectionKey<typeof HTTPService>;

const provideAxios = () => {
  if (getCurrentInstance()) {
    provide(axiosInjectionKey, HTTPService);
  }
};

export const useAxios = () => {
  if (!getCurrentInstance()) {
    return HTTPService;
  }

  if (!inject(axiosInjectionKey, undefined)) {
    provideAxios();
  }

  return inject(axiosInjectionKey, HTTPService);
};
