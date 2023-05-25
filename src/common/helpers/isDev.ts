import type { InjectionKey } from 'vue';
import {
  getCurrentInstance, inject, provide
} from 'vue';

const isDev: boolean = !!import.meta?.env?.VITE_APP_DEV && (import.meta?.env?.VITE_APP_DEV === 'true');
const isDevInjectionKey: InjectionKey<boolean> = Symbol('isDev');

const provideIsDev = () => {
  if (getCurrentInstance()) {
    provide(isDevInjectionKey, isDev);
  }
};

const useIsDev = () => {
  const isDevInstance = getCurrentInstance()
    ? inject<boolean>(isDevInjectionKey, false)
    : undefined;

  return isDevInstance || isDev;
};

export {
  provideIsDev,
  useIsDev
};

export default isDev;
