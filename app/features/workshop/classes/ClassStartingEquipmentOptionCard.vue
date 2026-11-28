<script setup lang="ts">
  import type {
    StartingEquipmentItemForm,
    StartingEquipmentOptionForm,
  } from '../model';

  import { STARTING_EQUIPMENT_LIMITS } from '~character/model';

  import {
    createCatalogEquipmentItem,
    createChoiceEquipmentItem,
    createCustomEquipmentItem,
    removeListEntry,
    replaceListEntry,
    STARTING_EQUIPMENT_EDITOR_ICON,
    STARTING_EQUIPMENT_EDITOR_TEXT,
  } from '../model';
  import ClassStartingEquipmentItemRow from './ClassStartingEquipmentItemRow.vue';

  /**
   * Вариант строки стартового снаряжения: позиции и монеты. Позиция
   * добавляется из справочника, своим предметом или выбором из категории.
   */
  const { fieldName, title, isFirst, isLast, isRemovable } = defineProps<{
    /** Имя поля варианта в форме: по нему показываются ошибки. */
    fieldName: string;
    /** Заголовок: «Вариант а)». */
    title: string;
    isFirst: boolean;
    isLast: boolean;
    /** Единственный вариант строки не удаляется — удаляется строка. */
    isRemovable: boolean;
  }>();

  const emit = defineEmits<{
    remove: [];
    move: [offset: -1 | 1];
  }>();

  const option = defineModel<StartingEquipmentOptionForm>({ required: true });

  const isItemsFull = computed(
    () => option.value.items.length >= STARTING_EQUIPMENT_LIMITS.items,
  );

  /**
   * Добавляет позицию в конец варианта.
   * @param item - новая позиция
   */
  function addItem(item: StartingEquipmentItemForm): void {
    option.value = { ...option.value, items: [...option.value.items, item] };
  }

  function addCatalogItem(): void {
    addItem(createCatalogEquipmentItem('WEAPON', '', ''));
  }

  function addCustomItem(): void {
    addItem(createCustomEquipmentItem());
  }

  function addChoiceItem(): void {
    addItem(createChoiceEquipmentItem());
  }

  /**
   * Заменяет позицию.
   * @param index - номер позиции
   * @param item - новая позиция
   */
  function changeItem(index: number, item: StartingEquipmentItemForm): void {
    option.value = {
      ...option.value,
      items: replaceListEntry(option.value.items, index, item),
    };
  }

  /**
   * Удаляет позицию.
   * @param index - номер позиции
   */
  function removeItem(index: number): void {
    option.value = {
      ...option.value,
      items: removeListEntry(option.value.items, index),
    };
  }

  /**
   * Меняет монеты варианта.
   * @param coins - монеты, зм
   */
  function changeCoins(coins: number | null): void {
    option.value = { ...option.value, coins };
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
  <div class="flex flex-col gap-2 rounded-lg border border-default p-2 sm:p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-sm font-semibold text-highlighted">{{ title }}</span>

      <div class="flex items-center gap-1">
        <UButton
          :aria-label="STARTING_EQUIPMENT_EDITOR_TEXT.moveUp"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.up"
          :disabled="isFirst"
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
          :aria-label="STARTING_EQUIPMENT_EDITOR_TEXT.removeOption"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.remove"
          :disabled="!isRemovable"
          color="error"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="remove"
        />
      </div>
    </div>

    <UFormField :name="`${fieldName}.items`">
      <div class="flex flex-col gap-2">
        <ClassStartingEquipmentItemRow
          v-for="(item, itemIndex) in option.items"
          :key="itemIndex"
          :model-value="item"
          :field-name="`${fieldName}.items.${itemIndex}`"
          @update:model-value="changeItem(itemIndex, $event)"
          @remove="removeItem(itemIndex)"
        />

        <span
          v-if="!option.items.length"
          class="text-sm text-muted"
        >
          {{ STARTING_EQUIPMENT_EDITOR_TEXT.emptyOption }}
        </span>
      </div>
    </UFormField>

    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="flex flex-wrap gap-1">
        <UButton
          :label="STARTING_EQUIPMENT_EDITOR_TEXT.addCatalogItem"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.catalog"
          :disabled="isItemsFull"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addCatalogItem"
        />

        <UButton
          :label="STARTING_EQUIPMENT_EDITOR_TEXT.addCustomItem"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.custom"
          :disabled="isItemsFull"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addCustomItem"
        />

        <UButton
          :label="STARTING_EQUIPMENT_EDITOR_TEXT.addChoiceItem"
          :icon="STARTING_EQUIPMENT_EDITOR_ICON.choice"
          :disabled="isItemsFull"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addChoiceItem"
        />
      </div>

      <UFormField
        :label="STARTING_EQUIPMENT_EDITOR_TEXT.coins"
        :name="`${fieldName}.coins`"
        class="w-36"
      >
        <UInputNumber
          :model-value="option.coins"
          :min="STARTING_EQUIPMENT_LIMITS.minCoins"
          class="w-full"
          @update:model-value="changeCoins"
        />
      </UFormField>
    </div>
  </div>
</template>
