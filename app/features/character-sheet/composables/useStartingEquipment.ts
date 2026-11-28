import type { ComputedRef, Ref } from 'vue';

import type { CatalogOption, StartingEquipmentLine } from '../model';

import {
  getChosenCoins,
  loadStartingEquipment,
  resolveChosenEquipment,
  STARTING_EQUIPMENT_TEXT,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/** Возвращаемое значение useStartingEquipment. */
export interface UseStartingEquipmentReturn {
  lines: Ref<Array<StartingEquipmentLine>>;
  /** Выбранный вариант каждой строки. */
  choices: Ref<Array<number>>;
  /** Выбранные записи для позиций «на выбор» по ключу позиции. */
  picks: Ref<Record<string, CatalogOption>>;
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
  const picks = ref<Record<string, CatalogOption>>({});
  const isEnabled = ref(true);
  const gold = ref(0);

  const hasEquipment = computed(() => lines.value.length > 0 || gold.value > 0);

  function reset(next: Array<StartingEquipmentLine>, nextGold = 0): void {
    lines.value = next;
    choices.value = next.map(() => 0);
    picks.value = {};
    isEnabled.value = true;
    gold.value = nextGold;
  }

  async function apply(): Promise<void> {
    if (!isEnabled.value || !hasEquipment.value) {
      return;
    }

    // Монеты выбранных вариантов добавляются к стартовым деньгам
    const coins = gold.value + getChosenCoins(lines.value, choices.value);

    const { items, hasFailures } = await loadStartingEquipment(
      resolveChosenEquipment(lines.value, choices.value, picks.value),
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

  return {
    lines,
    choices,
    picks,
    isEnabled,
    gold,
    hasEquipment,
    reset,
    apply,
  };
}
