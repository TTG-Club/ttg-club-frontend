import mitt from 'mitt';

import type { RollEntry } from '@/shared/stores/RollStore';

import type { ToastOptions } from 'vue-toastification/src/types';

export enum Event {
  NewRoll,
}

export type Events = {
  [Event.NewRoll]: {
    entry: RollEntry;
    toastOptions?: ToastOptions;
  };
};

export const eventBus = mitt<Events>();
