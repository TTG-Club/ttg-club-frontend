<script setup lang="ts">
  import type { StartingEquipmentLineForm } from '../model';

  import { STARTING_EQUIPMENT_LIMITS } from '~character/model';

  import { WorkshopListSection } from '../form';
  import {
    createStartingEquipmentLine,
    moveListEntry,
    parseStartingEquipmentText,
    removeListEntry,
    replaceListEntry,
    STARTING_EQUIPMENT_EDITOR_ICON,
    STARTING_EQUIPMENT_EDITOR_TEXT,
  } from '../model';
  import ClassStartingEquipmentLineCard from './ClassStartingEquipmentLineCard.vue';

  /**
   * Стартовое снаряжение класса данными: строки → варианты → позиции. Его
   * можно разобрать из текста снаряжения; заполненное заменяется только
   * после подтверждения.
   */
  const { fieldName, equipmentText } = defineProps<{
    /** Поле формы со строками: по нему показываются ошибки. */
    fieldName: string;
    /** Текст снаряжения класса блоками разметки: источник разбора. */
    equipmentText: Array<string>;
  }>();

  const lines = defineModel<Array<StartingEquipmentLineForm>>({
    required: true,
  });

  const toast = useToast();
  const isConfirmOpen = ref(false);

  const isLinesFull = computed(
    () => lines.value.length >= STARTING_EQUIPMENT_LIMITS.lines,
  );

  function addLine(): void {
    lines.value = [...lines.value, createStartingEquipmentLine()];
  }

  /**
   * Заменяет строку.
   * @param index - номер строки
   * @param line - новая строка
   */
  function changeLine(index: number, line: StartingEquipmentLineForm): void {
    lines.value = replaceListEntry(lines.value, index, line);
  }

  /**
   * Удаляет строку.
   * @param index - номер строки
   */
  function removeLine(index: number): void {
    lines.value = removeListEntry(lines.value, index);
  }

  /**
   * Переставляет строку.
   * @param index - номер строки
   * @param offset - куда двигать
   */
  function moveLine(index: number, offset: -1 | 1): void {
    lines.value = moveListEntry(lines.value, index, offset);
  }

  /** Заменяет строки разобранными из текста. */
  function applyParsed(): void {
    isConfirmOpen.value = false;

    const parsed = parseStartingEquipmentText(equipmentText);

    if (!parsed.length) {
      toast.add({
        title: STARTING_EQUIPMENT_EDITOR_TEXT.parseEmpty,
        color: 'warning',
      });

      return;
    }

    lines.value = parsed;

    toast.add({
      title: STARTING_EQUIPMENT_EDITOR_TEXT.parseDone,
      color: 'success',
    });
  }

  /** Разбирает текст; заполненное снаряжение — после подтверждения. */
  function parseText(): void {
    if (lines.value.length) {
      isConfirmOpen.value = true;

      return;
    }

    applyParsed();
  }

  function closeConfirm(): void {
    isConfirmOpen.value = false;
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <WorkshopListSection
      :title="STARTING_EQUIPMENT_EDITOR_TEXT.title"
      :description="STARTING_EQUIPMENT_EDITOR_TEXT.description"
      :add-label="STARTING_EQUIPMENT_EDITOR_TEXT.addLine"
      :add-icon="STARTING_EQUIPMENT_EDITOR_ICON.add"
      :is-add-disabled="isLinesFull"
      :is-empty="!lines.length"
      :empty-text="STARTING_EQUIPMENT_EDITOR_TEXT.empty"
      @add="addLine"
    >
      <UFormField :name="fieldName">
        <div class="flex flex-col gap-3">
          <ClassStartingEquipmentLineCard
            v-for="(line, index) in lines"
            :key="index"
            :model-value="line"
            :field-name="`${fieldName}.${index}`"
            :index="index"
            :is-last="index === lines.length - 1"
            @update:model-value="changeLine(index, $event)"
            @remove="removeLine(index)"
            @move="moveLine(index, $event)"
          />
        </div>
      </UFormField>
    </WorkshopListSection>

    <div>
      <UButton
        :label="STARTING_EQUIPMENT_EDITOR_TEXT.parse"
        :icon="STARTING_EQUIPMENT_EDITOR_ICON.parse"
        :disabled="!equipmentText.length"
        color="neutral"
        variant="soft"
        size="sm"
        @click.left.exact.prevent="parseText"
      />
    </div>

    <UModal
      v-model:open="isConfirmOpen"
      :title="STARTING_EQUIPMENT_EDITOR_TEXT.parseConfirmTitle"
      :description="STARTING_EQUIPMENT_EDITOR_TEXT.parseConfirmDescription"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            :label="STARTING_EQUIPMENT_EDITOR_TEXT.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="closeConfirm"
          />

          <UButton
            :label="STARTING_EQUIPMENT_EDITOR_TEXT.parseConfirm"
            color="error"
            @click.left.exact.prevent="applyParsed"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
