import {
    getCurrentInstance, inject, provide
} from 'vue';
import type { InjectionKey } from 'vue';

const isDev: boolean = !!process?.env?.VUE_APP_DEV && (process?.env?.VUE_APP_DEV === 'true');
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
