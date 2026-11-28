<script setup lang="ts">
  import type {
    StartingEquipmentLineForm,
    StartingEquipmentOptionForm,
  } from '../model';

  import {
    STARTING_EQUIPMENT_LIMITS,
    STARTING_EQUIPMENT_OPTION_LETTERS,
  } from '~character/model';

  import {
    createStartingEquipmentOption,
    formatStartingEquipmentFormLine,
    moveListEntry,
    removeListEntry,
    replaceListEntry,
    STARTING_EQUIPMENT_EDITOR_ICON,
    STARTING_EQUIPMENT_EDITOR_TEXT,
  } from '../model';
  import ClassStartingEquipmentOptionCard from './ClassStartingEquipmentOptionCard.vue';

  /**
   * Строка стартового снаряжения: один вариант — набор без выбора,
   * несколько — «а) … или б) …». Под заголовком — строка, как её увидят
   * на странице класса.
   */
  const { fieldName, index, isLast } = defineProps<{
    /** Имя поля строки в форме: по нему показываются ошибки. */
    fieldName: string;
    index: number;
    isLast: boolean;
  }>();

  const emit = defineEmits<{
    remove: [];
    move: [offset: -1 | 1];
  }>();

  const line = defineModel<StartingEquipmentLineForm>({ required: true });

  const title = computed(
    () => `${STARTING_EQUIPMENT_EDITOR_TEXT.line} ${index + 1}`,
  );

  const preview = computed(() => formatStartingEquipmentFormLine(line.value));

  const isOptionsFull = computed(
    () => line.value.options.length >= STARTING_EQUIPMENT_LIMITS.options,
  );

  const isOptionRemovable = computed(() => line.value.options.length > 1);

  /**
   * Заголовок варианта: «Вариант а)».
   * @param optionIndex - номер варианта
   */
  function getOptionTitle(optionIndex: number): string {
    const letter =
      STARTING_EQUIPMENT_OPTION_LETTERS[optionIndex] ?? String(optionIndex + 1);

    return `${STARTING_EQUIPMENT_EDITOR_TEXT.option} ${letter})`;
  }

  /**
   * Меняет список вариантов.
   * @param options - новые варианты
   */
  function setOptions(options: Array<StartingEquipmentOptionForm>): void {
    line.value = { ...line.value, options };
  }

  function addOption(): void {
    setOptions([...line.value.options, createStartingEquipmentOption()]);
  }

  /**
   * Заменяет вариант.
   * @param optionIndex - номер варианта
   * @param option - новый вариант
   */
  function changeOption(
    optionIndex: number,
    option: StartingEquipmentOptionForm,
  ): void {
    setOptions(replaceListEntry(line.value.options, optionIndex, option));
  }

  /**
   * Удаляет вариант.
   * @param optionIndex - номер варианта
   */
  function removeOption(optionIndex: number): void {
    setOptions(removeListEntry(line.value.options, optionIndex));
  }

  /**
   * Переставляет вариант.
   * @param optionIndex - номер варианта
   * @param offset - куда двигать
   */
  function moveOption(optionIndex: number, offset: -1 | 1): void {
    setOptions(moveListEntry(line.value.options, optionIndex, offset));
  }

  function moveUp(): void {
    emit('move', -1);
  }

  function moveDown(): void {
    emit('move', 1);
  }

  function remove(): void {
    emit('remove');
  }
</script>

<template>
  <UCard :ui="{ body: 'flex flex-col gap-3 p-3 sm:p-4' }">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h4 class="text-sm font-semibold text-highlighted">
        {{ title }}
      </h4>

      <div class="flex items-center gap-1">
        <UButton
          :label="STARTING_EQUIPMENT_EDITOR_TEXT.addOption"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.add"
          :disabled="isOptionsFull"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addOption"
        />

        <UButton
          :aria-label="STARTING_EQUIPMENT_EDITOR_TEXT.moveUp"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.up"
          :disabled="index === 0"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="moveUp"
        />

        <UButton
          :aria-label="STARTING_EQUIPMENT_EDITOR_TEXT.moveDown"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.down"
          :disabled="isLast"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="moveDown"
        />

        <UButton
          :label="STARTING_EQUIPMENT_EDITOR_TEXT.removeLine"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.remove"
          color="error"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="remove"
        />
      </div>
    </div>

    <p
      v-if="preview"
      class="text-sm text-muted"
    >
      {{ STARTING_EQUIPMENT_EDITOR_TEXT.preview }}: {{ preview }}
    </p>

    <UFormField :name="`${fieldName}.options`">
      <div class="flex flex-col gap-2">
        <ClassStartingEquipmentOptionCard
          v-for="(option, optionIndex) in line.options"
          :key="optionIndex"
          :model-value="option"
          :field-name="`${fieldName}.options.${optionIndex}`"
          :title="getOptionTitle(optionIndex)"
          :is-first="optionIndex === 0"
          :is-last="optionIndex === line.options.length - 1"
          :is-removable="isOptionRemovable"
          @update:model-value="changeOption(optionIndex, $event)"
          @remove="removeOption(optionIndex)"
          @move="moveOption(optionIndex, $event)"
        />
      </div>
    </UFormField>
  </UCard>
</template>
