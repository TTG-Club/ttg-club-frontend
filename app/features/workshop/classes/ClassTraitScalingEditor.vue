<script setup lang="ts">
  import type { ClassTraitScaling } from '../model';

  import { MarkupEditor } from '../markup-editor';
  import {
    CLASS_LEVEL_OPTIONS,
    CLASS_LIST_ICON,
    CLASS_SCALING_TEXT,
    createClassTraitScaling,
  } from '../model';

  /**
   * Рост умения по уровням, как в мастерской new.ttg.club: свёрнутый
   * раздел со счётчиком и кнопкой «Добавить уровень»; строка — уровень,
   * своё название, подсказка для таблицы, «скрывать в подклассе» (только у
   * класса) и описание того, что меняется. Поля проверяет форма класса.
   */
  const {
    traitLevel,
    fieldName,
    hasHideInSubclasses = false,
  } = defineProps<{
    /** Уровень самого умения: от него считается первый новый уровень. */
    traitLevel: number;
    /** Поле формы со списком роста: по нему показываются ошибки. */
    fieldName: string;
    /** Флажок «Скрывать в подклассе»: есть только у умений класса. */
    hasHideInSubclasses?: boolean;
  }>();

  const scaling = defineModel<Array<ClassTraitScaling>>({ required: true });

  /** Раздел раскрыт сразу, если рост уже заведён. */
  function hasRows(): boolean {
    return scaling.value.length > 0;
  }

  const isOpen = ref(hasRows());

  const levelItems = [...CLASS_LEVEL_OPTIONS];

  const chevronClass = computed(() => (isOpen.value ? 'rotate-90' : ''));

  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  function addRow(): void {
    scaling.value = [
      ...scaling.value,
      createClassTraitScaling(scaling.value, traitLevel),
    ];

    isOpen.value = true;
  }

  /**
   * Убирает уровень роста.
   * @param index - номер строки
   */
  function removeRow(index: number): void {
    scaling.value = scaling.value.filter((_, position) => position !== index);
  }

  /**
   * Меняет строку роста.
   * @param index - номер строки
   * @param patch - изменённые поля
   */
  function patchRow(index: number, patch: Partial<ClassTraitScaling>): void {
    scaling.value = scaling.value.map((row, position) =>
      position === index ? { ...row, ...patch } : row,
    );
  }

  /**
   * Уровень строки.
   * @param index - номер строки
   * @param level - уровень
   */
  function changeLevel(index: number, level: number): void {
    patchRow(index, { level });
  }

  /**
   * Название строки.
   * @param index - номер строки
   * @param name - название
   */
  function changeName(index: number, name: string): void {
    patchRow(index, { name });
  }

  /**
   * Подсказка строки.
   * @param index - номер строки
   * @param additional - подсказка
   */
  function changeAdditional(index: number, additional: string): void {
    patchRow(index, { additional });
  }

  /**
   * Флажок «Скрывать в подклассе».
   * @param index - номер строки
   * @param value - значение флажка
   */
  function changeHide(index: number, value: boolean | 'indeterminate'): void {
    patchRow(index, { hideInSubclasses: value === true });
  }

  /**
   * Описание строки.
   * @param index - номер строки
   * @param description - блоки разметки
   */
  function changeDescription(index: number, description: Array<string>): void {
    patchRow(index, { description });
  }

  /**
   * Имя поля строки для ошибок проверки.
   * @param index - номер строки
   * @param field - поле строки
   */
  function getFieldName(index: number, field: keyof ClassTraitScaling): string {
    return `${fieldName}.${index}.${field}`;
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex min-w-0 grow cursor-pointer items-center gap-2 text-left"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggle"
      >
        <UIcon
          name="tabler:chevron-right"
          class="size-4 shrink-0 text-muted transition-transform"
          :class="chevronClass"
        />

        <span class="text-sm font-medium text-highlighted">
          {{ CLASS_SCALING_TEXT.title }}
        </span>

        <UBadge
          v-if="scaling.length"
          :label="String(scaling.length)"
          color="primary"
          variant="subtle"
          size="sm"
        />
      </button>

      <UTooltip :text="CLASS_SCALING_TEXT.hint">
        <UIcon
          name="tabler:info-circle-filled"
          class="size-4 shrink-0 text-muted"
        />
      </UTooltip>

      <UButton
        :label="CLASS_SCALING_TEXT.add"
        :icon="CLASS_LIST_ICON.add"
        color="primary"
        variant="soft"
        size="xs"
        @click.left.exact.prevent="addRow"
      />
    </div>

    <template v-if="isOpen">
      <p
        v-if="!scaling.length"
        class="pl-6 text-xs text-dimmed"
      >
        {{ CLASS_SCALING_TEXT.empty }}
      </p>

      <div
        v-for="(row, index) in scaling"
        :key="index"
        class="grid grid-cols-1 gap-3 rounded-lg border border-default bg-elevated/40 p-3 md:grid-cols-[8rem_1fr_1fr_auto]"
      >
        <UFormField
          :label="CLASS_SCALING_TEXT.level"
          :name="getFieldName(index, 'level')"
        >
          <USelect
            :model-value="row.level"
            :items="levelItems"
            class="w-full"
            @update:model-value="changeLevel(index, $event)"
          />
        </UFormField>

        <UFormField
          :label="CLASS_SCALING_TEXT.name"
          :name="getFieldName(index, 'name')"
        >
          <UInput
            :model-value="row.name"
            :placeholder="CLASS_SCALING_TEXT.namePlaceholder"
            class="w-full"
            @update:model-value="changeName(index, $event)"
          />
        </UFormField>

        <UFormField
          :label="CLASS_SCALING_TEXT.additional"
          :name="getFieldName(index, 'additional')"
        >
          <UInput
            :model-value="row.additional"
            :placeholder="CLASS_SCALING_TEXT.additionalPlaceholder"
            class="w-full"
            @update:model-value="changeAdditional(index, $event)"
          />
        </UFormField>

        <div class="flex items-center gap-3 md:pt-6">
          <UCheckbox
            v-if="hasHideInSubclasses"
            :model-value="row.hideInSubclasses"
            :label="CLASS_SCALING_TEXT.hideInSubclasses"
            @update:model-value="changeHide(index, $event)"
          />

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            class="ml-auto"
            :aria-label="CLASS_SCALING_TEXT.remove"
            @click.left.exact.prevent="removeRow(index)"
          />
        </div>

        <UFormField
          :label="CLASS_SCALING_TEXT.description"
          :name="getFieldName(index, 'description')"
          class="md:col-span-4"
        >
          <MarkupEditor
            :model-value="row.description"
            :placeholder="CLASS_SCALING_TEXT.descriptionPlaceholder"
            @update:model-value="changeDescription(index, $event)"
          />
        </UFormField>
      </div>
    </template>
  </div>
</template>
