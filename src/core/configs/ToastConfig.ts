import { orderBy } from 'lodash-es';

import {
  toast as toastHelper,
  ToastEventBus as GlobalToastBus,
} from '@/shared/helpers/toast';
import IconToastClose from '@/shared/ui/icons/IconToastClose.vue';

import type {
  PluginOptions,
  ToastOptionsAndRequiredContent,
} from 'vue-toastification/dist/types/types';

export const ToastEventBus = GlobalToastBus;

const maxToasts = 6;

const filterToasts = (
  toasts: Array<ToastOptionsAndRequiredContent>,
): Array<ToastOptionsAndRequiredContent> => toasts;

const filterBeforeCreate = (
  toast: ToastOptionsAndRequiredContent,
  toasts: Array<ToastOptionsAndRequiredContent>,
): ToastOptionsAndRequiredContent | false => {
  if (maxToasts > toasts.length) {
    return toast;
  }

  const toastsForDelete = orderBy(toasts, ['id']).slice(
    0,
    Math.abs(maxToasts - toasts.length + 1),
  );

  for (const toastForDelete of toastsForDelete) {
    toastHelper.dismiss(toastForDelete.id!);
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
  maxToasts,
};

export default {
  ToastOptions,
  ToastEventBus,
};
