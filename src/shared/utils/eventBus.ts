import mitt from 'mitt';

import type { RollEntry } from '@/shared/stores/RollStore';

import type { ToastOptions } from 'vue-toastification/src/types';

export type Events = {
  'Roll.New': {
    entry: RollEntry;
    toastOptions?: ToastOptions;
  };
};

export const eventBus = mitt<Events>();
