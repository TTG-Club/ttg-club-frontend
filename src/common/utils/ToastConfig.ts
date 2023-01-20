import type { PluginOptions, ToastOptionsAndRequiredContent } from 'vue-toastification/dist/types/types';
import { EventBus, useToast } from 'vue-toastification';
import orderBy from 'lodash/orderBy';
import IconToastClose from '@/components/UI/icons/IconToastClose.vue';

export const ToastEventBus = new EventBus();

const maxToasts = 6;

const filterToasts = (toasts: Array<ToastOptionsAndRequiredContent>): Array<ToastOptionsAndRequiredContent> => toasts;

const filterBeforeCreate = (
    toast: ToastOptionsAndRequiredContent,
    toasts: Array<ToastOptionsAndRequiredContent>
): ToastOptionsAndRequiredContent | false => {
    if (maxToasts > toasts.length) {
        return toast;
    }

    const toastsForDelete = orderBy(toasts, ['id'])
        .slice(0, Math.abs(maxToasts - toasts.length + 1));

    const toastComposition = useToast(ToastEventBus);

    for (const toastForDelete of toastsForDelete) {
        toastComposition.dismiss(toastForDelete.id!);
    }

    return toast;
};

export const ToastOptions: PluginOptions = {
    shareAppContext: true,
    timeout: 1700,
    closeButton: IconToastClose,
    showCloseButtonOnHover: true,
    newestOnTop: true,
    filterBeforeCreate,
    filterToasts,
    maxToasts
};

export default {
    ToastOptions,
    ToastEventBus
};
