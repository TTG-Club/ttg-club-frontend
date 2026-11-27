import type { ComputedRef, Ref } from 'vue';

import type { StartingEquipmentLine } from '../model';

import {
  getChosenEquipment,
  loadStartingEquipment,
  STARTING_EQUIPMENT_TEXT,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/** Возвращаемое значение useStartingEquipment. */
export interface UseStartingEquipmentReturn {
  lines: Ref<Array<StartingEquipmentLine>>;
  /** Выбранный вариант каждой строки. */
  choices: Ref<Array<number>>;
  /** Добавлять ли снаряжение при применении мастера. */
  isEnabled: Ref<boolean>;
  /** Стартовые деньги, зм. */
  gold: Ref<number>;
  hasEquipment: ComputedRef<boolean>;
  /**
   * Новое снаряжение мастера: выбор сбрасывается на первые варианты.
   * @param lines - строки снаряжения
   * @param gold - стартовые деньги, зм
   */
  reset: (lines: Array<StartingEquipmentLine>, gold?: number) => void;
  /** Добавляет выбранное снаряжение и деньги в лист. */
  apply: () => Promise<void>;
}

/**
 * Стартовое снаряжение в мастере класса или предыстории: варианты строк,
 * выбор игрока и перенос в лист. Предметы справочника грузятся при
 * применении — до этого мастер ничего не запрашивает.
 */
export function useStartingEquipment(): UseStartingEquipmentReturn {
  const toast = useToast();
  const { update } = useCharacterSheet();

  const lines = ref<Array<StartingEquipmentLine>>([]);
  const choices = ref<Array<number>>([]);
  const isEnabled = ref(true);
  const gold = ref(0);

  const hasEquipment = computed(() => lines.value.length > 0 || gold.value > 0);

  function reset(next: Array<StartingEquipmentLine>, nextGold = 0): void {
    lines.value = next;
    choices.value = next.map(() => 0);
    isEnabled.value = true;
    gold.value = nextGold;
  }

  async function apply(): Promise<void> {
    if (!isEnabled.value || !hasEquipment.value) {
      return;
    }

    const coins = gold.value;

    const { items, hasFailures } = await loadStartingEquipment(
      getChosenEquipment(lines.value, choices.value),
    );

    update((current) => ({
      ...current,
      inventory: [...current.inventory, ...items],
      currency: { ...current.currency, gp: current.currency.gp + coins },
    }));

    if (hasFailures) {
      toast.add({ title: STARTING_EQUIPMENT_TEXT.loadError, color: 'warning' });
    }
  }

  return { lines, choices, isEnabled, gold, hasEquipment, reset, apply };
}
