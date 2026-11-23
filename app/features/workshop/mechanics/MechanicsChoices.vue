<script setup lang="ts">
  import type { ChoiceForm } from '../model';

  import { useExpandedItems } from '../composables';
  import { WorkshopCollapsibleItem } from '../form';
  import {
    createChoiceForm,
    MECHANICS_CHOICE_TYPE_OPTIONS,
    MECHANICS_TEXT,
  } from '../model';
  import MechanicsChoiceItem from './MechanicsChoiceItem.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /**
   * Выборы игрока. Каждый свёрнут: у выбора с вариантами и ступенями полей
   * много, а в шапке видно главное — подпись и вид.
   */
  const choices = defineModel<Array<ChoiceForm>>({ required: true });

  const { isExpanded, toggle, expand, drop } = useExpandedItems();

  /** Добавляет выбор со свободным ключом и сразу раскрывает его. */
  function add(): void {
    const addedIndex = choices.value.length;

    choices.value = [
      ...choices.value,
      createChoiceForm(choices.value.map((choice) => choice.key)),
    ];

    expand([addedIndex]);
  }

  /**
   * Убирает выбор.
   * @param index - номер выбора
   */
  function remove(index: number): void {
    choices.value = choices.value.filter((_, position) => position !== index);
    drop(index);
  }

  /**
   * Заменяет выбор целиком.
   * @param index - номер выбора
   * @param next - новый выбор
   */
  function replace(index: number, next: ChoiceForm): void {
    choices.value = choices.value.map((choice, position) =>
      position === index ? next : choice,
    );
  }

  /**
   * Шапка выбора: подпись для игрока, иначе ключ.
   * @param choice - выбор
   */
  function getTitle(choice: ChoiceForm): string {
    return choice.label || choice.key;
  }

  /**
   * Основной вид выбора в шапке.
   * @param choice - выбор
   */
  function getTypeLabel(choice: ChoiceForm): string {
    const [type] = choice.types;

    return (
      MECHANICS_CHOICE_TYPE_OPTIONS.find((option) => option.value === type)
        ?.label ?? ''
    );
  }
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.choices"
    :hint="MECHANICS_TEXT.choicesHint"
    :count="choices.length"
    :add-label="MECHANICS_TEXT.add"
    @add="add"
  >
    <WorkshopCollapsibleItem
      v-for="(choice, index) in choices"
      :key="index"
      :title="getTitle(choice)"
      :is-open="isExpanded(index)"
      :remove-label="MECHANICS_TEXT.remove"
      @toggle="toggle(index)"
      @remove="remove(index)"
    >
      <template #trailing>
        <UBadge
          v-if="getTypeLabel(choice)"
          :label="getTypeLabel(choice)"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
        />
      </template>

      <MechanicsChoiceItem
        :model-value="choice"
        @update:model-value="replace(index, $event)"
      />
    </WorkshopCollapsibleItem>
  </MechanicsSection>
</template>
