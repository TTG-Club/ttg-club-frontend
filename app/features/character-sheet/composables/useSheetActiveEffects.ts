import type { ActiveEffect, EffectConditionKey } from '~active-effects/model';

import {
  buildConditionActiveEffect,
  createEmptyActiveEffect,
  EFFECT_FORM_CONTEXT,
  EFFECT_ORIGIN,
} from '~active-effects/model';

import { isItemMechanicsActive, toggleSourceEffect } from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Активные эффекты листа — порт `useSheetActiveEffects` core-app: свои
 * эффекты и состояния игрока (состояние — свой эффект с `conditionKey`,
 * собранный из шаблона PHB 2014), эффекты умений и черт (правке не подлежат,
 * но выключаются) и эффекты надетого и настроенного снаряжения (только
 * показ).
 */
export function useSheetActiveEffects() {
  const { document, update } = useCharacterSheet();

  const customEffects = computed(() =>
    document.value.activeEffects.filter((effect) => !effect.conditionKey),
  );

  const activeConditionKeys = computed(
    () =>
      new Set(
        document.value.activeEffects.flatMap((effect) =>
          effect.conditionKey ? [effect.conditionKey] : [],
        ),
      ),
  );

  const featureEffects = computed(() =>
    document.value.sources.flatMap((source) =>
      source.activeEffects.map((effect) => ({
        effect,
        sourceId: source.id,
        sourceName: source.name,
        isDisabled: source.disabledEffects.includes(effect.id),
      })),
    ),
  );

  const equipmentEffects = computed(() =>
    document.value.inventory
      .filter(isItemMechanicsActive)
      .flatMap((item) =>
        item.activeEffects
          .filter((effect) => !effect.disabled)
          .map((effect) => ({ effect, sourceName: item.name })),
      ),
  );

  /**
   * Меняет список своих эффектов.
   * @param change - новый список из текущего
   */
  function updateEffects(
    change: (effects: Array<ActiveEffect>) => Array<ActiveEffect>,
  ): void {
    update((current) => ({
      ...current,
      activeEffects: change(current.activeEffects),
    }));
  }

  /**
   * Новый свой эффект — ещё не на листе.
   * @returns черновик эффекта
   */
  function createEffect(): ActiveEffect {
    return createEmptyActiveEffect(
      EFFECT_ORIGIN.manual,
      EFFECT_FORM_CONTEXT.ownEffects,
    );
  }

  /**
   * Сохраняет свой эффект: правит по идентификатору либо добавляет.
   * @param effect - эффект целиком
   */
  function saveEffect(effect: ActiveEffect): void {
    updateEffects((effects) =>
      effects.some((item) => item.id === effect.id)
        ? effects.map((item) => (item.id === effect.id ? effect : item))
        : [...effects, effect],
    );
  }

  /**
   * Удаляет свой эффект.
   * @param effectId - идентификатор эффекта
   */
  function removeEffect(effectId: string): void {
    updateEffects((effects) => effects.filter((item) => item.id !== effectId));
  }

  /**
   * Выключает или включает свой эффект.
   * @param effectId - идентификатор эффекта
   */
  function toggleEffectDisabled(effectId: string): void {
    updateEffects((effects) =>
      effects.map((item) =>
        item.id === effectId ? { ...item, disabled: !item.disabled } : item,
      ),
    );
  }

  /**
   * Выключает или включает эффект умения.
   * @param sourceId - источник
   * @param effectId - эффект
   */
  function toggleFeatureEffect(sourceId: string, effectId: string): void {
    update((current) => toggleSourceEffect(current, sourceId, effectId));
  }

  /**
   * Накладывает состояние или снимает наложенное.
   * @param key - ключ состояния
   */
  function toggleCondition(key: EffectConditionKey): void {
    if (activeConditionKeys.value.has(key)) {
      updateEffects((effects) =>
        effects.filter((item) => item.conditionKey !== key),
      );

      return;
    }

    const effect = buildConditionActiveEffect(key);

    if (effect) {
      updateEffects((effects) => [...effects, effect]);
    }
  }

  return {
    customEffects,
    activeConditionKeys,
    featureEffects,
    equipmentEffects,
    createEffect,
    saveEffect,
    removeEffect,
    toggleEffectDisabled,
    toggleFeatureEffect,
    toggleCondition,
  };
}
