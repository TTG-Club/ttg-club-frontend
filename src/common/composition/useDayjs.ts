import dayjs from 'dayjs';
import * as dayjsLocale from 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {
    getCurrentInstance, inject, provide
} from 'vue';

dayjs.locale(dayjsLocale);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

const dayjsInjectionKey = Symbol('dayjs');

const provideDayjs = () => {
    if (getCurrentInstance()) {
        provide(dayjsInjectionKey, dayjs);
    }
};

const useDayjs = () => {
    const dayjsInstance = getCurrentInstance()
        ? inject(dayjsInjectionKey, undefined)
        : undefined;

    return dayjsInstance || dayjs;
};

export {
    provideDayjs,
    useDayjs
};

export default dayjs;
