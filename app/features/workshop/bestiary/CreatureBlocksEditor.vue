<script setup lang="ts">
  import type { CreatureBlock, CreatureBlockField } from '../model';

  import { WorkshopListSection } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createCreatureBlock,
    CREATURE_BLOCK_TEXT,
    CREATURE_LIST_ICON,
    CREATURE_ROWS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Особенности или действия существа одного вида. */
  const { title, field } = defineProps<{
    title: string;
    /** Поле формы: по нему показываются ошибки проверки. */
    field: CreatureBlockField;
  }>();

  const blocks = defineModel<Array<CreatureBlock>>({ required: true });

  /**
   * Заменяет блок по номеру.
   * @param blockIndex - номер блока
   * @param update - новые поля блока
   */
  function patchBlock(
    blockIndex: number,
    update: Partial<CreatureBlock>,
  ): void {
    blocks.value = blocks.value.map((block, index) =>
      index === blockIndex ? { ...block, ...update } : block,
    );
  }

  function addBlock(): void {
    blocks.value = [...blocks.value, createCreatureBlock()];
  }

  /**
   * Удаляет блок.
   * @param blockIndex - номер блока
   */
  function removeBlock(blockIndex: number): void {
    blocks.value = blocks.value.filter((_, index) => index !== blockIndex);
  }

  /**
   * Меняет название блока.
   * @param blockIndex - номер блока
   * @param name - название
   */
  function changeName(blockIndex: number, name: string): void {
    patchBlock(blockIndex, { name });
  }

  /**
   * Меняет английское название блока.
   * @param blockIndex - номер блока
   * @param englishName - английское название
   */
  function changeEnglishName(blockIndex: number, englishName: string): void {
    patchBlock(blockIndex, { englishName });
  }

  /**
   * Меняет описание блока.
   * @param blockIndex - номер блока
   * @param description - текст описания
   */
  function changeDescription(blockIndex: number, description: string): void {
    patchBlock(blockIndex, { description });
  }

  /**
   * Меняет признак markdown в описании.
   * @param blockIndex - номер блока
   * @param value - значение флажка
   */
  function changeMarkdown(blockIndex: number, value: boolean | string): void {
    patchBlock(blockIndex, { markdown: value === true });
  }

  /**
   * Действие общее для нескольких существ: правка заденет их всех.
   * @param block - блок
   */
  function isShared(block: CreatureBlock): boolean {
    return (block.sharedUsageCount ?? 0) > 1;
  }

  /**
   * Предупреждение об общем действии.
   * @param block - блок
   */
  function getSharedText(block: CreatureBlock): string {
    return `${CREATURE_BLOCK_TEXT.shared} ${block.sharedUsageCount ?? 0}.`;
  }

  /**
   * Имя поля блока: по нему форма показывает ошибку проверки.
   * @param blockIndex - номер блока
   * @param key - поле блока
   */
  function getFieldName(blockIndex: number, key: keyof CreatureBlock): string {
    return `${field}.${blockIndex}.${key}`;
  }
</script>

<template>
  <WorkshopListSection
    :title="title"
    :add-label="CREATURE_BLOCK_TEXT.add"
    :add-icon="CREATURE_LIST_ICON.add"
    :is-empty="!blocks.length"
    :empty-text="CREATURE_BLOCK_TEXT.empty"
    @add="addBlock"
  >
    <UCard
      v-for="(block, blockIndex) in blocks"
      :key="blockIndex"
      :ui="{
        body: 'grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]',
      }"
    >
      <UAlert
        v-if="isShared(block)"
        :title="getSharedText(block)"
        :icon="CREATURE_LIST_ICON.shared"
        class="md:col-span-3"
        color="warning"
        variant="subtle"
      />

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.name"
        :name="getFieldName(blockIndex, 'name')"
        required
      >
        <UInput
          :model-value="block.name"
          class="w-full"
          @update:model-value="changeName(blockIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.englishName"
        :name="getFieldName(blockIndex, 'englishName')"
      >
        <UInput
          :model-value="block.englishName"
          class="w-full"
          @update:model-value="changeEnglishName(blockIndex, $event)"
        />
      </UFormField>

      <UButton
        :aria-label="CREATURE_BLOCK_TEXT.remove"
        :icon="CREATURE_LIST_ICON.remove"
        class="self-start justify-self-end md:mt-6"
        color="error"
        variant="ghost"
        @click.left.exact.prevent="removeBlock(blockIndex)"
      />

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.description"
        :name="getFieldName(blockIndex, 'description')"
        class="md:col-span-3"
      >
        <template #hint>
          <UCheckbox
            :model-value="block.markdown"
            :label="CREATURE_BLOCK_TEXT.markdown"
            size="sm"
            @update:model-value="changeMarkdown(blockIndex, $event)"
          />
        </template>

        <WorkshopHtmlEditor
          :model-value="block.description"
          :rows="CREATURE_ROWS.block"
          @update:model-value="changeDescription(blockIndex, $event)"
        />
      </UFormField>
    </UCard>
  </WorkshopListSection>
</template>
