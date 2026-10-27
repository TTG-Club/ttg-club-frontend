<script setup lang="ts">
  import type { ClassTrait } from '../model';

  import { useExpandedItems } from '../composables';
  import { WorkshopCollapsibleItem, WorkshopListSection } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    CLASS_LEVEL_OPTIONS,
    CLASS_LEVEL_SUFFIX,
    CLASS_LIST_ICON,
    CLASS_TRAIT_ROWS,
    CLASS_TRAITS_TEXT,
    createClassTrait,
    getWorkshopErrorIndexes,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /**
   * Умения класса или архетипа. Каждое свёрнуто под спойлер: у класса их
   * до двух десятков, и развёрнутые разом они растягивали форму на экраны.
   */
  const { fieldName, hasOptional = false } = defineProps<{
    /** Поле формы со списком умений: по нему показываются ошибки. */
    fieldName: string;
    /** Показывать флажок опционального умения: он есть только у классов. */
    hasOptional?: boolean;
  }>();

  const traits = defineModel<Array<ClassTrait>>({ required: true });

  const levelItems = [...CLASS_LEVEL_OPTIONS];

  const { isExpanded, toggle, expand, drop } = useExpandedItems();

  // Без флажка опционального умения якорь занимает всю строку
  const childClass = computed(() =>
    hasOptional ? 'md:col-span-2' : 'md:col-span-3',
  );

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

  /** Добавляет умение и сразу раскрывает его для заполнения. */
  function addTrait(): void {
    const addedIndex = traits.value.length;

    traits.value = [...traits.value, createClassTrait()];
    expand([addedIndex]);
  }

  /**
   * Удаляет умение.
   * @param traitIndex - номер умения
   */
  function removeTrait(traitIndex: number): void {
    traits.value = traits.value.filter((_, index) => index !== traitIndex);
    drop(traitIndex);
  }

  /**
   * Раскрывает умения с ошибками проверки, иначе их не видно.
   * @param fieldNames - имена полей с ошибками
   */
  function expandErrors(fieldNames: Array<string>): void {
    expand(getWorkshopErrorIndexes(fieldNames, fieldName));
  }

  /**
   * Уровень умения в шапке.
   * @param level - уровень
   */
  function getLevelLabel(level: number): string {
    return `${level} ${CLASS_LEVEL_SUFFIX}`;
  }

  /**
   * Показывать ли в шапке отметку опционального умения.
   * @param trait - умение
   */
  function isOptionalShown(trait: ClassTrait): boolean {
    return hasOptional && trait.optional;
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

  defineExpose({ expandErrors });
</script>

<template>
  <WorkshopListSection
    :title="CLASS_TRAITS_TEXT.title"
    :add-label="CLASS_TRAITS_TEXT.add"
    :add-icon="CLASS_LIST_ICON.add"
    :is-empty="!traits.length"
    :empty-text="CLASS_TRAITS_TEXT.empty"
    @add="addTrait"
  >
    <WorkshopCollapsibleItem
      v-for="(trait, traitIndex) in traits"
      :key="getTraitKey(trait, traitIndex)"
      :title="trait.name"
      :is-open="isExpanded(traitIndex)"
      :remove-label="CLASS_TRAITS_TEXT.remove"
      @toggle="toggle(traitIndex)"
      @remove="removeTrait(traitIndex)"
    >
      <template #leading>
        <UBadge
          :label="getLevelLabel(trait.level)"
          color="neutral"
          variant="outline"
          size="sm"
          class="shrink-0 tabular-nums"
        />
      </template>

      <template #trailing>
        <UBadge
          v-if="isOptionalShown(trait)"
          :label="CLASS_TRAITS_TEXT.optionalBadge"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
        />
      </template>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-[8rem_1fr_1fr]">
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
          :class="childClass"
        >
          <UInput
            :model-value="trait.child"
            class="w-full"
            @update:model-value="changeChild(traitIndex, $event)"
          />
        </UFormField>

        <div
          v-if="hasOptional"
          class="flex items-center md:pt-6"
        >
          <UCheckbox
            :model-value="trait.optional"
            :label="CLASS_TRAITS_TEXT.optional"
            @update:model-value="changeOptional(traitIndex, $event)"
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
      </div>
    </WorkshopCollapsibleItem>
  </WorkshopListSection>
</template>
