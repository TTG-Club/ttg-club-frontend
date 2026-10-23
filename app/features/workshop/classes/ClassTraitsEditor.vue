<script setup lang="ts">
  import type { ClassTrait } from '../model';

  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    CLASS_LEVEL_OPTIONS,
    CLASS_LIST_ICON,
    CLASS_TRAIT_ROWS,
    CLASS_TRAITS_TEXT,
    createClassTrait,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Умения класса или архетипа. */
  const { fieldName, hasOptional = false } = defineProps<{
    /** Поле формы со списком умений: по нему показываются ошибки. */
    fieldName: string;
    /** Показывать флажок опционального умения: он есть только у классов. */
    hasOptional?: boolean;
  }>();

  const traits = defineModel<Array<ClassTrait>>({ required: true });

  const levelItems = [...CLASS_LEVEL_OPTIONS];

  /**
   * Заменяет умение по номеру.
   * @param traitIndex - номер умения
   * @param update - новые поля умения
   */
  function patchTrait(traitIndex: number, update: Partial<ClassTrait>): void {
    traits.value = traits.value.map((trait, index) =>
      index === traitIndex ? { ...trait, ...update } : trait,
    );
  }

  function addTrait(): void {
    traits.value = [...traits.value, createClassTrait()];
  }

  /**
   * Удаляет умение.
   * @param traitIndex - номер умения
   */
  function removeTrait(traitIndex: number): void {
    traits.value = traits.value.filter((_, index) => index !== traitIndex);
  }

  /**
   * Меняет уровень умения.
   * @param traitIndex - номер умения
   * @param level - уровень
   */
  function changeLevel(traitIndex: number, level: number): void {
    patchTrait(traitIndex, { level });
  }

  /**
   * Меняет название умения.
   * @param traitIndex - номер умения
   * @param name - название
   */
  function changeName(traitIndex: number, name: string): void {
    patchTrait(traitIndex, { name });
  }

  /**
   * Меняет суффикс умения.
   * @param traitIndex - номер умения
   * @param suffix - суффикс
   */
  function changeSuffix(traitIndex: number, suffix: string): void {
    patchTrait(traitIndex, { suffix });
  }

  /**
   * Меняет дочерний якорь умения.
   * @param traitIndex - номер умения
   * @param child - якорь
   */
  function changeChild(traitIndex: number, child: string): void {
    patchTrait(traitIndex, { child });
  }

  /**
   * Меняет, опционально ли умение.
   * @param traitIndex - номер умения
   * @param value - значение флажка
   */
  function changeOptional(traitIndex: number, value: boolean | string): void {
    patchTrait(traitIndex, { optional: value === true });
  }

  /**
   * Меняет описание умения.
   * @param traitIndex - номер умения
   * @param description - разметка описания
   */
  function changeDescription(traitIndex: number, description: string): void {
    patchTrait(traitIndex, { description });
  }

  /**
   * Имя поля умения: по нему форма показывает ошибку проверки.
   * @param traitIndex - номер умения
   * @param field - поле умения
   */
  function getFieldName(traitIndex: number, field: keyof ClassTrait): string {
    return `${fieldName}.${traitIndex}.${field}`;
  }

  /**
   * Ключ умения: сохранённые различаются идентификатором.
   * @param trait - умение
   * @param traitIndex - номер умения
   */
  function getTraitKey(trait: ClassTrait, traitIndex: number): string {
    return trait.id ? String(trait.id) : `new-${traitIndex}`;
  }
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-highlighted">
        {{ CLASS_TRAITS_TEXT.title }}
      </h3>

      <UButton
        :label="CLASS_TRAITS_TEXT.add"
        :icon="CLASS_LIST_ICON.add"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="addTrait"
      />
    </div>

    <UCard
      v-for="(trait, traitIndex) in traits"
      :key="getTraitKey(trait, traitIndex)"
      :ui="{ body: 'grid grid-cols-1 gap-3 md:grid-cols-[8rem_1fr_1fr]' }"
    >
      <UFormField
        :label="WORKSHOP_FIELD_TEXT.level"
        :name="getFieldName(traitIndex, 'level')"
        required
      >
        <USelect
          :model-value="trait.level"
          :items="levelItems"
          class="w-full"
          @update:model-value="changeLevel(traitIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.name"
        :name="getFieldName(traitIndex, 'name')"
        required
      >
        <UInput
          :model-value="trait.name"
          class="w-full"
          @update:model-value="changeName(traitIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="CLASS_TRAITS_TEXT.suffix"
        :name="getFieldName(traitIndex, 'suffix')"
      >
        <UInput
          :model-value="trait.suffix"
          class="w-full"
          @update:model-value="changeSuffix(traitIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="CLASS_TRAITS_TEXT.child"
        :name="getFieldName(traitIndex, 'child')"
        class="md:col-span-2"
      >
        <UInput
          :model-value="trait.child"
          class="w-full"
          @update:model-value="changeChild(traitIndex, $event)"
        />
      </UFormField>

      <div class="flex items-center justify-between gap-3 md:pt-6">
        <UCheckbox
          v-if="hasOptional"
          :model-value="trait.optional"
          :label="CLASS_TRAITS_TEXT.optional"
          @update:model-value="changeOptional(traitIndex, $event)"
        />

        <UButton
          :aria-label="CLASS_TRAITS_TEXT.remove"
          :icon="CLASS_LIST_ICON.remove"
          color="error"
          variant="ghost"
          class="ml-auto"
          @click.left.exact.prevent="removeTrait(traitIndex)"
        />
      </div>

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.description"
        :name="getFieldName(traitIndex, 'description')"
        class="md:col-span-3"
        required
      >
        <WorkshopHtmlEditor
          :model-value="trait.description"
          :rows="CLASS_TRAIT_ROWS"
          @update:model-value="changeDescription(traitIndex, $event)"
        />
      </UFormField>
    </UCard>

    <UEmpty
      v-if="!traits.length"
      :icon="CLASS_LIST_ICON.traitsEmpty"
      :title="CLASS_TRAITS_TEXT.empty"
      variant="naked"
    />
  </section>
</template>
