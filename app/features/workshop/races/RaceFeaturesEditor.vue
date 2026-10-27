<script setup lang="ts">
  import type { RaceFeature } from '../model';

  import { WorkshopListSection } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createRaceFeature,
    RACE_FEATURE_ROWS,
    RACE_FEATURES_TEXT,
    RACE_LIST_ICON,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Особенности расы. */
  const features = defineModel<Array<RaceFeature>>({ required: true });

  /**
   * Заменяет особенность по номеру.
   * @param featureIndex - номер особенности
   * @param update - новые поля особенности
   */
  function patchFeature(
    featureIndex: number,
    update: Partial<RaceFeature>,
  ): void {
    features.value = features.value.map((feature, index) =>
      index === featureIndex ? { ...feature, ...update } : feature,
    );
  }

  function addFeature(): void {
    features.value = [...features.value, createRaceFeature()];
  }

  /**
   * Удаляет особенность.
   * @param featureIndex - номер особенности
   */
  function removeFeature(featureIndex: number): void {
    features.value = features.value.filter(
      (_, index) => index !== featureIndex,
    );
  }

  /**
   * Меняет название особенности.
   * @param featureIndex - номер особенности
   * @param name - название
   */
  function changeName(featureIndex: number, name: string): void {
    patchFeature(featureIndex, { name });
  }

  /**
   * Меняет английское название особенности.
   * @param featureIndex - номер особенности
   * @param englishName - английское название
   */
  function changeEnglishName(featureIndex: number, englishName: string): void {
    patchFeature(featureIndex, { englishName });
  }

  /**
   * Меняет заменяемую особенность родительской расы.
   * @param featureIndex - номер особенности
   * @param replaceFeatureId - идентификатор заменяемой особенности
   */
  function changeReplace(
    featureIndex: number,
    replaceFeatureId: number | null,
  ): void {
    patchFeature(featureIndex, { replaceFeatureId });
  }

  /**
   * Меняет, открыта ли особенность в карточке по умолчанию.
   * @param featureIndex - номер особенности
   * @param value - значение флажка
   */
  function changeOpened(featureIndex: number, value: boolean | string): void {
    patchFeature(featureIndex, { feature: value === true });
  }

  /**
   * Меняет описание особенности.
   * @param featureIndex - номер особенности
   * @param description - разметка описания
   */
  function changeDescription(featureIndex: number, description: string): void {
    patchFeature(featureIndex, { description });
  }

  /**
   * Имя поля особенности: по нему форма показывает ошибку проверки.
   * @param featureIndex - номер особенности
   * @param field - поле особенности
   */
  function getFieldName(
    featureIndex: number,
    field: keyof RaceFeature,
  ): string {
    return `features.${featureIndex}.${field}`;
  }

  /**
   * Ключ особенности: сохранённые различаются идентификатором.
   * @param feature - особенность
   * @param featureIndex - номер особенности
   */
  function getFeatureKey(feature: RaceFeature, featureIndex: number): string {
    return feature.id ? String(feature.id) : `new-${featureIndex}`;
  }
</script>

<template>
  <WorkshopListSection
    :title="RACE_FEATURES_TEXT.title"
    :add-label="RACE_FEATURES_TEXT.add"
    :add-icon="RACE_LIST_ICON.add"
    :is-empty="!features.length"
    :empty-text="RACE_FEATURES_TEXT.empty"
    @add="addFeature"
  >
    <UCard
      v-for="(feature, featureIndex) in features"
      :key="getFeatureKey(feature, featureIndex)"
      :ui="{ body: 'grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-2' }"
    >
      <UFormField
        :label="WORKSHOP_FIELD_TEXT.name"
        :name="getFieldName(featureIndex, 'name')"
        required
      >
        <UInput
          :model-value="feature.name"
          class="w-full"
          @update:model-value="changeName(featureIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.englishName"
        :name="getFieldName(featureIndex, 'englishName')"
      >
        <UInput
          :model-value="feature.englishName"
          class="w-full"
          @update:model-value="changeEnglishName(featureIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="RACE_FEATURES_TEXT.replace"
        :help="RACE_FEATURES_TEXT.replaceHelp"
        :name="getFieldName(featureIndex, 'replaceFeatureId')"
      >
        <UInputNumber
          :model-value="feature.replaceFeatureId"
          :min="1"
          class="w-full"
          @update:model-value="changeReplace(featureIndex, $event)"
        />
      </UFormField>

      <div class="flex items-center justify-between gap-3 md:pt-6">
        <UCheckbox
          :model-value="feature.feature"
          :label="RACE_FEATURES_TEXT.opened"
          @update:model-value="changeOpened(featureIndex, $event)"
        />

        <UButton
          :aria-label="RACE_FEATURES_TEXT.remove"
          :icon="RACE_LIST_ICON.remove"
          color="error"
          variant="ghost"
          @click.left.exact.prevent="removeFeature(featureIndex)"
        />
      </div>

      <UFormField
        :label="WORKSHOP_FIELD_TEXT.description"
        :name="getFieldName(featureIndex, 'description')"
        class="md:col-span-2"
        required
      >
        <WorkshopHtmlEditor
          :model-value="feature.description"
          :rows="RACE_FEATURE_ROWS"
          @update:model-value="changeDescription(featureIndex, $event)"
        />
      </UFormField>
    </UCard>
  </WorkshopListSection>
</template>
