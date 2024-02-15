import { useBroadcastChannel, useLocalStorage } from '@vueuse/core';
import { ref } from 'vue';

import type { TRollType } from '../../../shared/helpers/roll';
import type { RollBase } from 'dice-roller-parser';

export type TRollHistoryItem = {
  id: string;
  date: string;
  roll: RollBase;
  source: string;
  label?: string;
  type?: TRollType;
};

const limit = 100;

const isOpen = ref(true);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

let fallbackSource = 'Бросок';

// TODO: Different keys for different rolls channels
const rolls = useLocalStorage<TRollHistoryItem[]>('rolls', []);

const addRoll = (
  item: Omit<TRollHistoryItem, 'source'> &
    Partial<Pick<TRollHistoryItem, 'source'>>
): TRollHistoryItem | undefined => {
  if (rolls.value.find(roll => roll.id === item.id)) {
    return undefined;
  }

  rolls.value.push({
    ...item,
    source: item.source ?? fallbackSource
  });

  if (rolls.value.length > limit) {
    rolls.value.shift();
  }

  return rolls.value.at(-1);
};

const { channel, post: broadcast } = useBroadcastChannel({
  name: 'rolls-history'
});

export const useDiceHistory = () => {
  const registerRoll = (
    item: Omit<TRollHistoryItem, 'source'> &
      Partial<Pick<TRollHistoryItem, 'source'>>
  ) => {
    addRoll(item);
    broadcast(item);
    // TODO: Send to external services
  };

  channel.value?.addEventListener('message', event => {
    addRoll(event.data);
  });

  const setFallbackSource = (source: string) => {
    fallbackSource = source;
  };

  const clear = () => {
    rolls.value = [];
  };

  return { isOpen, toggle, rolls, registerRoll, setFallbackSource, clear };
};
