<script setup lang="ts">
  import type { CreatureLegendaryAction } from '../model';

  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createCreatureLegendaryAction,
    CREATURE_BLOCK_TEXT,
    CREATURE_LIST_ICON,
    CREATURE_ROWS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Легендарные действия существа: название и описание. */
  const actions = defineModel<Array<CreatureLegendaryAction>>({
    required: true,
  });

  /**
   * Заменяет действие по номеру.
   * @param actionIndex - номер действия
   * @param update - новые поля действия
   */
  function patchAction(
    actionIndex: number,
    update: Partial<CreatureLegendaryAction>,
  ): void {
    actions.value = actions.value.map((action, index) =>
      index === actionIndex ? { ...action, ...update } : action,
    );
  }

  function addAction(): void {
    actions.value = [...actions.value, createCreatureLegendaryAction()];
  }

  /**
   * Удаляет действие.
   * @param actionIndex - номер действия
   */
  function removeAction(actionIndex: number): void {
    actions.value = actions.value.filter((_, index) => index !== actionIndex);
  }

  /**
   * Меняет название действия.
   * @param actionIndex - номер действия
   * @param name - название
   */
  function changeName(actionIndex: number, name: string): void {
    patchAction(actionIndex, { name });
  }

  /**
   * Меняет описание действия.
   * @param actionIndex - номер действия
   * @param description - текст описания
   */
  function changeDescription(actionIndex: number, description: string): void {
    patchAction(actionIndex, { description });
  }

  /**
   * Имя поля действия: по нему форма показывает ошибку проверки.
   * @param actionIndex - номер действия
   * @param key - поле действия
   */
  function getFieldName(
    actionIndex: number,
    key: keyof CreatureLegendaryAction,
  ): string {
    return `legendary.${actionIndex}.${key}`;
  }
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-highlighted">
        {{ CREATURE_BLOCK_TEXT.legendary }}
      </h3>

      <UButton
        :label="CREATURE_BLOCK_TEXT.add"
        :icon="CREATURE_LIST_ICON.add"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="addAction"
      />
    </div>

    <UCard
      v-for="(action, actionIndex) in actions"
      :key="actionIndex"
      :ui="{ body: 'flex flex-col gap-3' }"
    >
      <div class="flex items-end gap-3">
        <UFormField
          :label="WORKSHOP_FIELD_TEXT.name"
          :name="getFieldName(actionIndex, 'name')"
          class="flex-1"
          required
        >
          <UInput
            :model-value="action.name"
            class="w-full"
            @update:model-value="changeName(actionIndex, $event)"
          />
        </UFormField>

        <UButton
          :aria-label="CREATURE_BLOCK_TEXT.remove"
          :icon="CREATURE_LIST_ICON.remove"
          color="error"
          variant="ghost"
          @click.left.exact.prevent="removeAction(actionIndex)"
        />
      </div>

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.description"
        :name="getFieldName(actionIndex, 'description')"
      >
        <WorkshopHtmlEditor
          :model-value="action.description"
          :rows="CREATURE_ROWS.block"
          @update:model-value="changeDescription(actionIndex, $event)"
        />
      </UFormField>
    </UCard>

    <UEmpty
      v-if="!actions.length"
      :icon="CREATURE_LIST_ICON.empty"
      :title="CREATURE_BLOCK_TEXT.empty"
      variant="naked"
    />
  </section>
</template>
