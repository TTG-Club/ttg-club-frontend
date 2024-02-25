import { useBroadcastChannel, useLocalStorage } from '@vueuse/core';
import { type RollBase } from 'dice-roller-parser';
import { defineStore } from 'pinia';
import { computed, toRaw } from 'vue';

import { type RollType } from '../utils/roll';
import { type PartialBy } from '../utils/types';

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

export const useRollStore = defineStore('RollStore', () => {
  const { channel, post: broadcast } = useBroadcastChannel({
    name: 'rolls',
  });

  channel.value?.addEventListener('message', (event) => {
    addRoll(event.data);
  });

  let fallbackSource = DEFAULT_FALLBACK_SOURCE;

  function setFallbackSource(source: string) {
    fallbackSource = source;
  }

  // TODO: Different keys for different rolls channels
  const rolls = useLocalStorage<RollEntry[]>('rolls', []);

  const rollsSortedByDate = computed(() =>
    rolls.value.sort((a, b) => (a.date < b.date ? 1 : -1)),
  );

  function registerRoll(item: PartialBy<RollEntry, 'source'>) {
    const roll = addRoll(item);

    if (roll) {
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
    setFallbackSource,
    rolls,
    rollsSortedByDate,
    registerRoll,
    clearRolls,
  };
});
