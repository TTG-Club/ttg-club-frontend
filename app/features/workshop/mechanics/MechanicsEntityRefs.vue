<script setup lang="ts">
  import type { EntityRefForm } from '../model';

  import {
    createEntityRefForm,
    MECHANICS_ICON,
    MECHANICS_TEXT,
  } from '../model';
  import MechanicsRow from './MechanicsRow.vue';

  /**
   * Ссылки на записи справочника: url и название на момент сохранения.
   * Сверка на листе идёт по url, название — снимок для подписи.
   */
  const { label } = defineProps<{
    label: string;
  }>();

  const references = defineModel<Array<EntityRefForm>>({ required: true });

  function add(): void {
    references.value = [...references.value, createEntityRefForm()];
  }

  /**
   * Убирает ссылку.
   * @param index - номер ссылки
   */
  function remove(index: number): void {
    references.value = references.value.filter(
      (_, position) => position !== index,
    );
  }
</script>

<template>
  <div class="col-span-full flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm text-default">{{ label }}</span>

      <UButton
        :icon="MECHANICS_ICON.add"
        :label="MECHANICS_TEXT.add"
        color="neutral"
        variant="soft"
        size="xs"
        @click.left.exact.prevent="add"
      />
    </div>

    <MechanicsRow
      v-for="(reference, index) in references"
      :key="index"
      @remove="remove(index)"
    >
      <UFormField
        :label="MECHANICS_TEXT.url"
        class="lg:col-span-2"
      >
        <UInput
          v-model="reference.url"
          :placeholder="MECHANICS_TEXT.urlPlaceholder"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.name"
        class="lg:col-span-2"
      >
        <UInput
          v-model="reference.name"
          class="w-full"
        />
      </UFormField>
    </MechanicsRow>
  </div>
</template>
