<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectChange,
    EffectConditionKey,
    EffectFormLayout,
  } from '../../model';

  import {
    ADJACENT_ALLY_CONDITION_LABEL,
    ADJACENT_ALLY_CONDITION_OPTIONS,
    describeConditionName,
    describeEffectChangeCondition,
    EFFECT_CONDITION_BADGE_ICON,
    EFFECT_CONDITION_EXPR_SUGGESTIONS,
    EFFECT_CONDITION_KEY_ITEMS,
    EFFECT_CONDITION_OPTIONS,
    EFFECT_CONDITION_REMOVE_ICON,
    EFFECT_MODIFIERS_STEP_LABELS,
    EFFECT_ROLL_CONDITION_ALWAYS,
    EFFECT_TARGET_ALLY_ADJACENT_CONDITION,
    isAdjacentAllyCondition,
    writeActiveEffectStageRows,
  } from '../../model';
  import EffectChanges from './EffectChanges.vue';
  import EffectFlags from './EffectFlags.vue';

  /**
   * Шаг «Что меняет»: состояние, модификаторы, особые правила, сохранённый
   * бросок, иммунитеты к состояниям и их подавление. При заведённых ступенях
   * строки и правила — это строки действующей ступени, правка уходит в неё.
   */
  defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Показывать приоритет у всех модификаторов. */
    showPriorityField: boolean;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** Название состояния, которым считается эффект. */
  const conditionBadgeLabel = computed(() =>
    effect.value.conditionKey
      ? `${EFFECT_MODIFIERS_STEP_LABELS.conditionPrefix}${describeConditionName(effect.value.conditionKey)}`
      : '',
  );

  /** Условие броска о союзнике рядом с целью: какой союзник, выбирается ниже. */
  const hasAdjacentAllyCondition = computed(
    () =>
      effect.value.rollCondition !== undefined
      && isAdjacentAllyCondition(effect.value.rollCondition),
  );

  /**
   * Условия броска в выборе: «Всегда», условие из данных, которого в словаре
   * нет (составное — иначе поле выглядело бы пустым), и весь словарь. Условия о
   * союзнике рядом — одним пунктом: какой союзник, выбирается вторым полем.
   */
  const rollConditionOptions = computed(() => {
    const current = effect.value.rollCondition;

    const isKnown =
      current === undefined
      || EFFECT_CONDITION_EXPR_SUGGESTIONS.some(
        (suggestion) => suggestion.value === current,
      );

    return [
      {
        value: EFFECT_ROLL_CONDITION_ALWAYS,
        label: EFFECT_MODIFIERS_STEP_LABELS.rollConditionAlways,
      },
      ...(isKnown
        ? []
        : [{ value: current, label: describeEffectChangeCondition(current) }]),
      ...EFFECT_CONDITION_EXPR_SUGGESTIONS.flatMap((suggestion) => {
        if (suggestion.value === EFFECT_TARGET_ALLY_ADJACENT_CONDITION) {
          return [{ ...suggestion, label: ADJACENT_ALLY_CONDITION_LABEL }];
        }

        return isAdjacentAllyCondition(suggestion.value) ? [] : [suggestion];
      }),
    ];
  });

  /**
   * Записывает условие броска.
   *
   * @param nextCondition условие; «Всегда» — без условия.
   */
  function writeRollCondition(nextCondition: string): void {
    effect.value = {
      ...effect.value,
      rollCondition:
        nextCondition === EFFECT_ROLL_CONDITION_ALWAYS
          ? undefined
          : nextCondition,
    };
  }

  const rollCondition = computed({
    get: () =>
      hasAdjacentAllyCondition.value
        ? EFFECT_TARGET_ALLY_ADJACENT_CONDITION
        : (effect.value.rollCondition ?? EFFECT_ROLL_CONDITION_ALWAYS),
    set: (nextCondition: string) => {
      // Повторный выбор пункта о союзнике не сбрасывает выбранного союзника
      if (
        nextCondition === EFFECT_TARGET_ALLY_ADJACENT_CONDITION
        && hasAdjacentAllyCondition.value
      ) {
        return;
      }

      writeRollCondition(nextCondition);
    },
  });

  const adjacentAllyCondition = computed({
    get: () =>
      effect.value.rollCondition ?? EFFECT_TARGET_ALLY_ADJACENT_CONDITION,
    set: writeRollCondition,
  });

  const changes = computed({
    get: () => effect.value.changes,
    set: (nextChanges: EffectChange[]) => {
      effect.value = writeActiveEffectStageRows({
        ...effect.value,
        changes: nextChanges,
      });
    },
  });

  const flags = computed({
    get: () => effect.value.flags,
    set: (nextFlags: string[]) => {
      effect.value = writeActiveEffectStageRows({
        ...effect.value,
        flags: nextFlags,
      });
    },
  });

  // Пустая строка стирает поле, а не пишет пустоту: иначе эффект уносил бы в
  // VTTG настройку, которой автор не задавал
  const savedRoll = computed({
    get: () => effect.value.savedRoll ?? '',
    set: (nextFormula: string) => {
      effect.value = {
        ...effect.value,
        savedRoll: nextFormula.trim() ? nextFormula : undefined,
      };
    },
  });

  const conditionImmunities = computed({
    get: () => effect.value.conditionImmunities ?? [],
    set: (keys: EffectConditionKey[]) => {
      effect.value = {
        ...effect.value,
        conditionImmunities: keys.length > 0 ? keys : undefined,
      };
    },
  });

  // Пустой список в данных не пишется
  const suppressConditions = computed({
    get: () => effect.value.suppressConditions ?? [],
    set: (keys: string[]) => {
      effect.value = {
        ...effect.value,
        suppressConditions: keys.length > 0 ? keys : undefined,
      };
    },
  });

  /**
   * Перестаёт считать эффект состоянием: модификаторы и правила остаются, но
   * иммунитет к состоянию на нём больше не сработает.
   */
  function removeCondition(): void {
    effect.value = {
      ...effect.value,
      conditionKey: undefined,
      exhaustionLevel: undefined,
    };
  }
</script>

<template>
  <div
    v-if="conditionBadgeLabel"
    class="flex flex-wrap items-center gap-2"
  >
    <UBadge
      color="primary"
      variant="subtle"
      size="lg"
      :icon="EFFECT_CONDITION_BADGE_ICON"
    >
      {{ conditionBadgeLabel }}
    </UBadge>

    <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      :icon="EFFECT_CONDITION_REMOVE_ICON"
      :label="EFFECT_MODIFIERS_STEP_LABELS.conditionRemove"
      :title="EFFECT_MODIFIERS_STEP_LABELS.conditionRemoveHint"
      @click.left.exact.prevent="removeCondition"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <div>
      <span class="text-sm font-medium">
        {{ EFFECT_MODIFIERS_STEP_LABELS.rollConditionTitle }}
      </span>

      <p class="text-xs text-muted">
        {{ EFFECT_MODIFIERS_STEP_LABELS.rollConditionHint }}
      </p>
    </div>

    <USelect
      v-model="rollCondition"
      :items="rollConditionOptions"
      value-key="value"
      size="sm"
      class="w-full"
    />

    <template v-if="hasAdjacentAllyCondition">
      <div>
        <span class="text-sm font-medium">
          {{ EFFECT_MODIFIERS_STEP_LABELS.adjacentAllyTitle }}
        </span>

        <p class="text-xs text-muted">
          {{ EFFECT_MODIFIERS_STEP_LABELS.adjacentAllyHint }}
        </p>
      </div>

      <USelect
        v-model="adjacentAllyCondition"
        :items="ADJACENT_ALLY_CONDITION_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </template>
  </div>

  <EffectChanges
    v-model="changes"
    :show-priority-field="showPriorityField"
  />

  <EffectFlags v-model="flags" />

  <UFormField
    :label="EFFECT_MODIFIERS_STEP_LABELS.savedRollTitle"
    :help="EFFECT_MODIFIERS_STEP_LABELS.savedRollHint"
  >
    <UInput
      v-model="savedRoll"
      :placeholder="EFFECT_MODIFIERS_STEP_LABELS.savedRollPlaceholder"
      size="sm"
      class="w-full font-mono"
    />
  </UFormField>

  <div
    v-if="layout.showConditionImmunities"
    class="flex flex-col gap-1.5"
  >
    <div>
      <span class="text-sm font-medium">
        {{ EFFECT_MODIFIERS_STEP_LABELS.immunitiesTitle }}
      </span>

      <p class="text-xs text-muted">
        {{ EFFECT_MODIFIERS_STEP_LABELS.immunitiesHint }}
      </p>
    </div>

    <USelectMenu
      v-model="conditionImmunities"
      :items="EFFECT_CONDITION_OPTIONS"
      value-key="value"
      label-key="label"
      multiple
      class="w-full"
      :placeholder="EFFECT_MODIFIERS_STEP_LABELS.immunitiesPlaceholder"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <div>
      <span class="text-sm font-medium">
        {{ EFFECT_MODIFIERS_STEP_LABELS.suppressTitle }}
      </span>

      <p class="text-xs text-muted">
        {{ EFFECT_MODIFIERS_STEP_LABELS.suppressHint }}
      </p>
    </div>

    <USelectMenu
      v-model="suppressConditions"
      :items="EFFECT_CONDITION_KEY_ITEMS"
      value-key="value"
      label-key="label"
      multiple
      class="w-full"
      :placeholder="EFFECT_MODIFIERS_STEP_LABELS.suppressPlaceholder"
    />
  </div>
</template>
