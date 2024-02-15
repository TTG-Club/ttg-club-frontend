import { useBroadcastChannel, useLocalStorage } from '@vueuse/core';
import { ref } from 'vue';

import type { RollType } from '@/shared/utils/roll';
import type { PartialBy } from '@/shared/utils/types';

import type { RollBase } from 'dice-roller-parser';

export type DiceHistoryItem = {
  id: string;
  date: string;
  roll: RollBase;
  source: string;
  label?: string;
  type?: RollType;
};

const limit = 100;

const isOpen = ref(true);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

let fallbackSource = 'Бросок';

// TODO: Different keys for different rolls channels
const rolls = useLocalStorage<DiceHistoryItem[]>('rolls', []);

const addRoll = (
  item: PartialBy<DiceHistoryItem, 'source'>,
): DiceHistoryItem | undefined => {
  if (rolls.value.find((roll) => roll.id === item.id)) {
    return undefined;
  }

  rolls.value.push({
    ...item,
    source: item.source ?? fallbackSource,
  });

  if (rolls.value.length > limit) {
    rolls.value.shift();
  }

  return rolls.value.at(-1);
};

const { channel, post: broadcast } = useBroadcastChannel({
  name: 'rolls-history',
});

export const useDiceHistory = () => {
  const registerRoll = (item: PartialBy<DiceHistoryItem, 'source'>) => {
    addRoll(item);
    broadcast(item);
    // TODO: Send to external services
  };

  channel.value?.addEventListener('message', (event) => {
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
