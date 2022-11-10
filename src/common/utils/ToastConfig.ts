import type { PluginOptions, ToastOptionsAndRequiredContent } from 'vue-toastification/dist/types/types';
import { EventBus } from 'vue-toastification';
import IconToastClose from '@/components/UI/icons/IconToastClose.vue';

export const ToastEventBus = new EventBus();

const filterToasts = (toasts: Array<ToastOptionsAndRequiredContent>): Array<ToastOptionsAndRequiredContent> => toasts;

export const ToastOptions: PluginOptions = {
    shareAppContext: true,
    timeout: 1700,
    closeButton: IconToastClose,
    showCloseButtonOnHover: true,
    maxToasts: 6,
    newestOnTop: true,
    eventBus: ToastEventBus,
    filterToasts
};

export default {
    ToastOptions,
    ToastEventBus
};
