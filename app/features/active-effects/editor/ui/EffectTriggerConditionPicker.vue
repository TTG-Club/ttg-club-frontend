<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    EffectTriggerEvent,
    TriggerConditionKind,
    TriggerConditionListParameter,
    TriggerConditionParameter,
    TriggerConditionPart,
  } from '../../model';

  import {
    DEFAULT_ABILITY_THRESHOLD,
    DEFAULT_TAG_COUNT_THRESHOLD,
    EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES,
    EFFECT_TRIGGER_CONDITION_KIND_DEFAULT_VALUES,
    EFFECT_TRIGGER_CONDITION_KIND_LABELS,
    EFFECT_TRIGGER_CONDITION_LABELS,
    EFFECT_TRIGGER_CONDITION_VALUE_OPTIONS,
    getTriggerConditionParameter,
    isEffectTag,
    listTriggerConditionKinds,
    MIN_CONDITION_NUMBER,
    MIN_TAG_COUNT_THRESHOLD,
    normalizeTagCountThreshold,
    readTriggerConditionParts,
    TRIGGER_CONDITION_ABILITY_PARAMETER,
    TRIGGER_CONDITION_NUMBER_PARAMETER,
    TRIGGER_CONDITION_TAG_PARAMETER,
    TRIGGER_CONDITION_TEXT_PARAMETER,
    triggerConditionHasAmount,
    writeTriggerCondition,
  } from '../../model';

  /**
   * Условие срабатывания: части из словаря срабатываний, соединённые «и».
   * Какие части что-то значат на событии, решает модель
   * (`listTriggerConditionKinds`); часть, которую словарь не знает,
   * показывается как есть и не теряется.
   */
  const {
    event,
    knownTags,
    title = EFFECT_TRIGGER_CONDITION_LABELS.title,
    emptyText = EFFECT_TRIGGER_CONDITION_LABELS.always,
  } = defineProps<{
    /** Событие срабатывания: от него зависят доступные части. */
    event: EffectTriggerEvent;
    /** Отметки, которые ставит этот эффект: условие по отметке их предлагает. */
    knownTags: readonly string[];
    /** Заголовок списка; по умолчанию — «Условие». */
    title?: string;
    /** Текст без условия; по умолчанию — «срабатывает всегда». */
    emptyText?: string;
  }>();

  /** Условие строкой словаря (`self.tag === "x" && …`); пусто — без условия. */
  const condition = defineModel<string | undefined>('condition', {
    required: true,
  });

  /** Строка списка частей: разобранная часть или строка как есть. */
  interface ConditionRow {
    key: string;
    text: string;
    /** Подсказка к строке, которую форма не узнала. */
    title?: string;
    /** Значение разобранной части. */
    value: string | undefined;
    /** Варианты значения части; пусто — значение не выбирается списком. */
    valueItems: Array<{ label: string; value: string }>;
    /** Значение части выбирается списком. */
    showsValueSelect: boolean;
    /** Значение части вводится строкой — ключ отметки. */
    showsTagInput: boolean;
    /** Значение части — свободная строка: название вида. */
    showsTextInput: boolean;
    /** Значение части — число: хиты носителя. */
    showsNumberInput: boolean;
    /** У части есть порог: сколько отметок нужно или какая характеристика. */
    amount?: number;
  }

  /**
   * Выбирается ли значение части списком.
   *
   * @param parameter что выбирается у части; `undefined` — значения нет.
   * @returns `true`, если у параметра есть список вариантов.
   */
  function isConditionListParameter(
    parameter: TriggerConditionParameter | undefined,
  ): parameter is TriggerConditionListParameter {
    return (
      parameter !== undefined
      && parameter !== TRIGGER_CONDITION_TAG_PARAMETER
      && parameter !== TRIGGER_CONDITION_NUMBER_PARAMETER
      && parameter !== TRIGGER_CONDITION_TEXT_PARAMETER
    );
  }

  /**
   * Порог части по умолчанию: у характеристики и у счётчика отметок свой.
   *
   * @param parameter что выбирается у части.
   * @returns порог.
   */
  function getDefaultAmount(
    parameter: TriggerConditionParameter | undefined,
  ): number {
    return parameter === TRIGGER_CONDITION_ABILITY_PARAMETER
      ? DEFAULT_ABILITY_THRESHOLD
      : DEFAULT_TAG_COUNT_THRESHOLD;
  }

  const parts = computed(() => readTriggerConditionParts(condition.value));

  const conditionRows = computed<ConditionRow[]>(() =>
    parts.value.map((part, index) => {
      if (typeof part === 'string') {
        return {
          key: `${index}-raw`,
          text: part,
          title: EFFECT_TRIGGER_CONDITION_LABELS.unknown,
          value: undefined,
          valueItems: [],
          showsValueSelect: false,
          showsTagInput: false,
          showsTextInput: false,
          showsNumberInput: false,
        };
      }

      const parameter = getTriggerConditionParameter(part.kind);

      const valueItems = isConditionListParameter(parameter)
        ? EFFECT_TRIGGER_CONDITION_VALUE_OPTIONS[parameter]
        : [];

      return {
        key: `${index}-${part.kind}`,
        text: EFFECT_TRIGGER_CONDITION_KIND_LABELS[part.kind],
        value: part.value,
        valueItems,
        showsValueSelect: valueItems.length > 0,
        showsTagInput: parameter === TRIGGER_CONDITION_TAG_PARAMETER,
        showsTextInput: parameter === TRIGGER_CONDITION_TEXT_PARAMETER,
        showsNumberInput: parameter === TRIGGER_CONDITION_NUMBER_PARAMETER,
        amount: triggerConditionHasAmount(part.kind)
          ? (part.amount ?? getDefaultAmount(parameter))
          : undefined,
      };
    }),
  );

  /** Условия нет: срабатывает всегда. */
  const isEmpty = computed(() => conditionRows.value.length === 0);

  /**
   * Записывает части условия.
   *
   * @param nextParts части по порядку.
   */
  function writeParts(
    nextParts: ReadonlyArray<TriggerConditionPart | string>,
  ): void {
    condition.value = writeTriggerCondition(nextParts);
  }

  /**
   * Значение новой части: своё у вида, где общее не годится («на раунде 50»
   * бессмысленно), у отметки — первая отметка эффекта.
   *
   * @param kind вид части.
   * @param parameter что выбирается.
   * @returns значение.
   */
  function getDefaultValue(
    kind: TriggerConditionKind,
    parameter: TriggerConditionParameter,
  ): string {
    const kindDefault = EFFECT_TRIGGER_CONDITION_KIND_DEFAULT_VALUES[kind];

    if (kindDefault !== undefined) {
      return kindDefault;
    }

    return parameter === TRIGGER_CONDITION_TAG_PARAMETER
      ? (knownTags[0] ?? EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES.tag)
      : EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES[parameter];
  }

  /**
   * Добавляет часть условия; у части со значением — значение по умолчанию.
   *
   * @param kind вид части.
   */
  function addPart(kind: TriggerConditionKind): void {
    const parameter = getTriggerConditionParameter(kind);

    writeParts([
      ...parts.value,
      parameter ? { kind, value: getDefaultValue(kind, parameter) } : { kind },
    ]);
  }

  /**
   * Меняет свободную строку части. Пустая не пишется: с ней часть не
   * разобралась бы обратно и поле ввода пропало бы.
   *
   * @param index номер части.
   * @param enteredText введённая строка.
   */
  function updatePartText(index: number, enteredText: string): void {
    const text = enteredText.trim();

    if (text) {
      updatePartValue(index, text);
    }
  }

  /**
   * Убирает часть условия.
   *
   * @param index номер части.
   */
  function removePart(index: number): void {
    writeParts(parts.value.filter((_, partIndex) => partIndex !== index));
  }

  /**
   * Меняет значение части условия.
   *
   * @param index номер части.
   * @param partValue новое значение.
   */
  function updatePartValue(index: number, partValue: string): void {
    writeParts(
      parts.value.map((part, partIndex) =>
        partIndex === index && typeof part !== 'string'
          ? { ...part, value: partValue }
          : part,
      ),
    );
  }

  /**
   * Меняет число части условия: хиты носителя. Пустое поле — ноль: условие без
   * числа форма не знает и потеряла бы поле ввода.
   *
   * @param index номер части.
   * @param enteredNumber введённое число.
   */
  function updatePartNumber(
    index: number,
    enteredNumber: number | null | undefined,
  ): void {
    updatePartValue(
      index,
      String(Math.max(MIN_CONDITION_NUMBER, Math.trunc(enteredNumber ?? 0))),
    );
  }

  /**
   * Меняет порог счётчика отметок.
   *
   * @param index номер части.
   * @param enteredAmount введённый порог; пусто — наименьший.
   */
  function updatePartAmount(
    index: number,
    enteredAmount: number | null | undefined,
  ): void {
    const amount = normalizeTagCountThreshold(enteredAmount);

    writeParts(
      parts.value.map((part, partIndex) =>
        partIndex === index && typeof part !== 'string'
          ? { ...part, amount }
          : part,
      ),
    );
  }

  /**
   * Меняет ключ отметки части. Негодный ключ не пишется: условие с ним
   * разобралось бы строкой, которую форма не знает, и поле ввода пропало бы.
   *
   * @param index номер части.
   * @param enteredTag введённый ключ.
   */
  function updatePartTag(index: number, enteredTag: string): void {
    const tag = enteredTag.trim();

    if (isEffectTag(tag)) {
      updatePartValue(index, tag);
    }
  }

  const addPartMenuItems = computed<DropdownMenuItem[]>(() =>
    listTriggerConditionKinds(event).map((kind) => ({
      label: EFFECT_TRIGGER_CONDITION_KIND_LABELS[kind],
      onSelect: () => addPart(kind),
    })),
  );
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs font-medium text-default">
      {{ title }}
    </span>

    <p
      v-if="isEmpty"
      class="text-xs text-muted"
    >
      {{ emptyText }}
    </p>

    <div
      v-for="(conditionRow, index) in conditionRows"
      :key="conditionRow.key"
      class="flex flex-wrap items-center gap-2"
    >
      <span
        v-if="index > 0"
        class="text-xs text-muted"
      >
        {{ EFFECT_TRIGGER_CONDITION_LABELS.and }}
      </span>

      <span
        class="text-xs text-default"
        :title="conditionRow.title"
      >
        {{ conditionRow.text }}
      </span>

      <USelect
        v-if="conditionRow.showsValueSelect"
        :model-value="conditionRow.value"
        :items="conditionRow.valueItems"
        value-key="value"
        size="xs"
        class="w-44"
        @update:model-value="updatePartValue(index, $event)"
      />

      <UInputNumber
        v-else-if="conditionRow.showsNumberInput"
        :model-value="Number(conditionRow.value)"
        :min="MIN_CONDITION_NUMBER"
        size="xs"
        class="w-28"
        @update:model-value="updatePartNumber(index, $event)"
      />

      <UInput
        v-else-if="conditionRow.showsTextInput"
        :model-value="conditionRow.value"
        size="xs"
        class="w-44"
        @update:model-value="updatePartText(index, $event)"
      />

      <template v-else-if="conditionRow.showsTagInput">
        <UInput
          :model-value="conditionRow.value"
          size="xs"
          class="w-40"
          @update:model-value="updatePartTag(index, $event)"
        />

        <UButton
          v-for="tag in knownTags"
          :key="tag"
          color="neutral"
          variant="soft"
          size="xs"
          :label="tag"
          :title="EFFECT_TRIGGER_CONDITION_LABELS.knownTags"
          @click.left.exact.prevent="updatePartValue(index, tag)"
        />
      </template>

      <template v-if="conditionRow.amount !== undefined">
        <span class="text-xs text-muted">
          {{ EFFECT_TRIGGER_CONDITION_LABELS.amount }}
        </span>

        <UInputNumber
          :model-value="conditionRow.amount"
          :min="MIN_TAG_COUNT_THRESHOLD"
          size="xs"
          class="w-24"
          @update:model-value="updatePartAmount(index, $event)"
        />
      </template>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="tabler:x"
        :aria-label="EFFECT_TRIGGER_CONDITION_LABELS.remove"
        @click.left.exact.prevent="removePart(index)"
      />
    </div>

    <UDropdownMenu
      :items="addPartMenuItems"
      :content="{ align: 'start' }"
      :ui="{ content: 'max-h-72 overflow-y-auto' }"
    >
      <UButton
        color="primary"
        variant="soft"
        size="xs"
        icon="tabler:filter-plus"
        class="w-fit"
        :label="EFFECT_TRIGGER_CONDITION_LABELS.add"
      />
    </UDropdownMenu>
  </div>
</template>
