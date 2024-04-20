import { useBroadcastChannel } from '@vueuse/core';
import { type RollBase } from 'dice-roller-parser';
import localforage from 'localforage';
import { sortBy } from 'lodash-es';
import { defineStore } from 'pinia';
import { computed, toRaw } from 'vue';

import { useLocalforageItem } from '@/shared/composables/useLocalforageItem';
import { DB_NAME } from '@/shared/constants/UI';

import { Event, eventBus } from '../utils/eventBus';
import { type RollType } from '../utils/roll';
import { type PartialBy } from '../utils/types';

import type { ToastOptions } from 'vue-toastification/src/types';

const ROLL_ITEMS_LIMIT = 100;
const DEFAULT_FALLBACK_SOURCE = 'Бросок';

export type RollEntry = {
  id: string;
  date: string;
  roll: RollBase;
  source: string;
  label?: string;
  type?: RollType;
};

export enum RollNotificationMode {
  Notification,
  History,
}

const store = localforage.createInstance({
  name: DB_NAME,
  storeName: 'rolls',
});

export const useRollStore = defineStore('RollStore', () => {
  const notificationMode = useLocalforageItem(
    store,
    'notification-mode',
    RollNotificationMode.Notification,
  );

  const { channel, post: broadcast } = useBroadcastChannel({
    name: 'rolls',
  });

  channel.value?.addEventListener('message', (event) => {
    addRoll(event.data);
  });

  let fallbackSource = DEFAULT_FALLBACK_SOURCE;

  function setFallbackSource(source?: string) {
    fallbackSource = source ?? DEFAULT_FALLBACK_SOURCE;
  }

  // TODO: Different keys for different rolls channels
  const rolls = useLocalforageItem<RollEntry[]>(store, 'rolls', []);

  const rollsSortedByDate = computed(() => sortBy(rolls.value, 'date'));

  function registerRoll(
    item: PartialBy<RollEntry, 'source'>,
    toastOptions?: ToastOptions,
  ) {
    const roll = addRoll(item);

    if (roll) {
      eventBus.emit(Event.NewRoll, { entry: roll, toastOptions });
      broadcast(roll);
    }
  }

  function addRoll(item: PartialBy<RollEntry, 'source'>) {
    if (rolls.value.find((roll) => roll.id === item.id)) {
      return undefined;
    }

    rolls.value.push({
      ...item,
      source: item.source ?? fallbackSource,
    });

    if (rolls.value.length > ROLL_ITEMS_LIMIT) {
      rolls.value.shift();
    }

    return toRaw(rolls.value.at(-1));
  }

  function clearRolls() {
    rolls.value = [];
  }

  return {
    notificationMode,
    setFallbackSource,
    rollsSortedByDate,
    registerRoll,
    clearRolls,
  };
});
