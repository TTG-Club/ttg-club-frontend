import { EventBus, useToast } from 'vue-toastification';

export const ToastEventBus = new EventBus();

export const toast = useToast(ToastEventBus);
