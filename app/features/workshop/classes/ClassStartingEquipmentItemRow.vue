<script setup lang="ts">
  import type { CatalogOption } from '~character-sheet/model';
  import type {
    StartingEquipmentCategory,
    StartingEquipmentSection,
  } from '~character/model';

  import type { StartingEquipmentItemForm } from '../model';

  import { STARTING_EQUIPMENT_LIMITS } from '~character/model';

  import { MechanicsRow } from '../mechanics';
  import {
    STARTING_EQUIPMENT_CATEGORY_OPTIONS,
    STARTING_EQUIPMENT_EDITOR_TEXT,
    STARTING_EQUIPMENT_SECTION_OPTIONS,
  } from '../model';
  import ClassEquipmentCatalogSearch from './ClassEquipmentCatalogSearch.vue';

  /**
   * Позиция варианта стартового снаряжения: запись справочника (раздел и
   * поиск), свой предмет (название) или выбор из категории.
   */
  const { fieldName } = defineProps<{
    /** Имя поля позиции в форме: по нему показываются ошибки. */
    fieldName: string;
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  const item = defineModel<StartingEquipmentItemForm>({ required: true });

  const sectionItems = [...STARTING_EQUIPMENT_SECTION_OPTIONS];
  const categoryItems = [...STARTING_EQUIPMENT_CATEGORY_OPTIONS];

  const catalogSection = computed(() =>
    item.value.kind === 'ITEM' ? item.value.section : null,
  );

  const isChoice = computed(() => item.value.kind === 'CHOICE');

  /**
   * Поле позиции в форме.
   * @param field - поле позиции
   */
  function getFieldName(field: keyof StartingEquipmentItemForm): string {
    return `${fieldName}.${field}`;
  }

  /**
   * Меняет поля позиции.
   * @param update - новые поля
   */
  function patch(update: Partial<StartingEquipmentItemForm>): void {
    item.value = { ...item.value, ...update };
  }

  /**
   * Меняет раздел поиска: выбранная запись другого раздела сбрасывается.
   * @param section - раздел справочника
   */
  function changeSection(section: StartingEquipmentSection): void {
    patch({ section, url: null, name: '' });
  }

  /**
   * Ставит запись справочника.
   * @param option - найденная запись
   */
  function pickCatalog(option: CatalogOption): void {
    patch({ url: option.url, name: option.name });
  }

  /**
   * Меняет название своего предмета.
   * @param name - название
   */
  function changeName(name: string): void {
    patch({ name });
  }

  /**
   * Меняет категорию выбора.
   * @param category - категория
   */
  function changeCategory(category: StartingEquipmentCategory): void {
    patch({ category });
  }

  /**
   * Меняет количество.
   * @param quantity - количество
   */
  function changeQuantity(quantity: number | null): void {
    patch({ quantity: quantity ?? STARTING_EQUIPMENT_LIMITS.minQuantity });
  }

  /**
   * Меняет уточнение.
   * @param description - уточнение
   */
  function changeDescription(description: string): void {
    patch({ description });
  }

  function remove(): void {
    emit('remove');
  }
</script>

<template>
  <MechanicsRow @remove="remove">
    <template v-if="catalogSection">
      <UFormField
        :label="STARTING_EQUIPMENT_EDITOR_TEXT.section"
        :name="getFieldName('section')"
      >
        <USelect
          :model-value="catalogSection"
          :items="sectionItems"
          class="w-full"
          @update:model-value="changeSection"
        />
      </UFormField>

      <UFormField
        :label="STARTING_EQUIPMENT_EDITOR_TEXT.catalogItem"
        :name="getFieldName('name')"
        required
      >
        <ClassEquipmentCatalogSearch
          :section="catalogSection"
          :url="item.url"
          :name="item.name"
          @pick="pickCatalog"
        />
      </UFormField>
    </template>

    <UFormField
      v-else-if="isChoice"
      :label="STARTING_EQUIPMENT_EDITOR_TEXT.category"
      :name="getFieldName('category')"
      class="sm:col-span-2"
      required
    >
      <USelect
        :model-value="item.category ?? undefined"
        :items="categoryItems"
        class="w-full"
        @update:model-value="changeCategory"
      />
    </UFormField>

    <UFormField
      v-else
      :label="STARTING_EQUIPMENT_EDITOR_TEXT.name"
      :name="getFieldName('name')"
      class="sm:col-span-2"
      required
    >
      <UInput
        :model-value="item.name"
        class="w-full"
        @update:model-value="changeName"
      />
    </UFormField>

    <UFormField
      :label="STARTING_EQUIPMENT_EDITOR_TEXT.quantity"
      :name="getFieldName('quantity')"
    >
      <UInputNumber
        :model-value="item.quantity"
        :min="STARTING_EQUIPMENT_LIMITS.minQuantity"
        :max="STARTING_EQUIPMENT_LIMITS.maxQuantity"
        class="w-full"
        @update:model-value="changeQuantity"
      />
    </UFormField>

    <UFormField
      :label="STARTING_EQUIPMENT_EDITOR_TEXT.itemDescription"
      :name="getFieldName('description')"
    >
      <UInput
        :model-value="item.description"
        :placeholder="STARTING_EQUIPMENT_EDITOR_TEXT.descriptionPlaceholder"
        class="w-full"
        @update:model-value="changeDescription"
      />
    </UFormField>
  </MechanicsRow>
</template>
