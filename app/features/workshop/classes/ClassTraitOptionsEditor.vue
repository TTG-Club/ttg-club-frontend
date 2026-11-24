<script setup lang="ts">
  import type { ActiveEffect } from '~active-effects/model';

  import type {
    ClassTraitOption,
    ClassTraitOptionsChoice,
    MechanicsForm,
  } from '../model';

  import { useExpandedItems } from '../composables';
  import { WorkshopCollapsibleItem } from '../form';
  import { MarkupEditor } from '../markup-editor';
  import { WorkshopTraitMechanics } from '../mechanics';
  import {
    CLASS_LEVEL_OPTIONS,
    CLASS_LIST_ICON,
    CLASS_OPTIONS_TEXT,
    classTraitOptionListSchema,
    createClassTraitOption,
    createClassTraitOptionsStep,
    MECHANICS_KIND,
    toClassTraitOption,
  } from '../model';

  /**
   * Варианты умения, как в мастерской new.ttg.club: свёрнутый раздел со
   * счётчиком и «Добавить вариант». Внутри — тип списка (связь с разделом
   * «Особенности классов»), его название, перенос записей типа из раздела,
   * настройка выбора для листа и сами варианты с механикой. Поля проверяет
   * форма класса (`fieldName.*`).
   */
  const {
    traitLevel,
    fieldName,
    typeItems,
    hasHideInSubclasses = false,
  } = defineProps<{
    traitLevel: number;
    /** Префикс полей умения для ошибок проверки. */
    fieldName: string;
    /** Типы списков из фильтра раздела «Особенности классов». */
    typeItems: ReadonlyArray<{ label: string; value: string }>;
    /** Флажок «Скрывать в подклассе»: только у умений класса. */
    hasHideInSubclasses?: boolean;
  }>();

  const optionsType = defineModel<string>('type', { required: true });
  const optionsName = defineModel<string>('name', { required: true });

  const options = defineModel<Array<ClassTraitOption>>('options', {
    required: true,
  });

  const choice = defineModel<ClassTraitOptionsChoice | null>('choice', {
    required: true,
  });

  /** Пункт «без типа» в списке типов. */
  const NO_TYPE = 'NONE';

  const api = useApi();
  const toast = useToast();

  /** Раздел раскрыт сразу, если варианты уже заведены. */
  function hasOptions(): boolean {
    return options.value.length > 0;
  }

  const isOpen = ref(hasOptions());
  const isImporting = ref(false);

  const { isExpanded, toggle, expand, drop } = useExpandedItems();

  const levelItems = [...CLASS_LEVEL_OPTIONS];

  const typeSelectItems = computed(() => [
    { label: CLASS_OPTIONS_TEXT.typePlaceholder, value: NO_TYPE },
    ...typeItems,
  ]);

  const optionLevelItems = computed(() => [
    { label: CLASS_OPTIONS_TEXT.optionLevelPlaceholder, value: 0 },
    ...levelItems,
  ]);

  const chevronClass = computed(() => (isOpen.value ? 'rotate-90' : ''));

  const isSelectable = computed(() => choice.value !== null);

  function toggleSection(): void {
    isOpen.value = !isOpen.value;
  }

  /**
   * Тип списка.
   * @param value - пункт списка
   */
  function setType(value: unknown): void {
    optionsType.value =
      typeof value === 'string' && value !== NO_TYPE ? value : '';
  }

  function addOption(): void {
    const index = options.value.length;

    options.value = [...options.value, createClassTraitOption()];
    isOpen.value = true;
    expand([index]);
  }

  /**
   * Убирает вариант.
   * @param index - номер варианта
   */
  function removeOption(index: number): void {
    options.value = options.value.filter((_, position) => position !== index);
    drop(index);
  }

  /**
   * Меняет вариант.
   * @param index - номер варианта
   * @param patch - изменённые поля
   */
  function patchOption(index: number, patch: Partial<ClassTraitOption>): void {
    options.value = options.value.map((option, position) =>
      position === index ? { ...option, ...patch } : option,
    );
  }

  /**
   * Уровень доступности варианта.
   * @param index - номер варианта
   * @param value - уровень; 0 — с уровня умения
   */
  function setOptionLevel(index: number, value: unknown): void {
    patchOption(index, {
      level: typeof value === 'number' && value > 0 ? value : null,
    });
  }

  /**
   * Страница книги.
   * @param index - номер варианта
   * @param value - страница
   */
  function setOptionPage(index: number, value: number | null): void {
    patchOption(index, { page: value && value > 0 ? Math.trunc(value) : null });
  }

  /**
   * Флажок варианта.
   * @param index - номер варианта
   * @param field - флажок
   * @param value - значение
   */
  function setOptionFlag(
    index: number,
    field: 'repeatable' | 'hideInSubclasses',
    value: boolean | 'indeterminate',
  ): void {
    patchOption(index, { [field]: value === true });
  }

  /**
   * Текстовое поле варианта.
   * @param index - номер варианта
   * @param field - поле
   * @param value - значение
   */
  function setOptionText(
    index: number,
    field:
      | 'name'
      | 'englishName'
      | 'altName'
      | 'prerequisite'
      | 'additional'
      | 'source',
    value: string | number,
  ): void {
    patchOption(index, { [field]: String(value) });
  }

  /**
   * Описание варианта.
   * @param index - номер варианта
   * @param description - блоки разметки
   */
  function setOptionDescription(
    index: number,
    description: Array<string>,
  ): void {
    patchOption(index, { description });
  }

  /**
   * Механика варианта.
   * @param index - номер варианта
   * @param mechanics - механика
   */
  function setOptionMechanics(index: number, mechanics: MechanicsForm): void {
    patchOption(index, { mechanics });
  }

  /**
   * Эффекты варианта.
   * @param index - номер варианта
   * @param activeEffects - эффекты
   */
  function setOptionEffects(
    index: number,
    activeEffects: Array<ActiveEffect>,
  ): void {
    patchOption(index, { activeEffects });
  }

  /**
   * Варианты выбирают в листе или нет.
   * @param value - флажок
   */
  function setSelectable(value: boolean | 'indeterminate'): void {
    choice.value = value === true ? { label: '', count: 1, scaling: [] } : null;
  }

  /**
   * Меняет настройку выбора.
   * @param patch - изменённые поля
   */
  function patchChoice(patch: Partial<ClassTraitOptionsChoice>): void {
    if (choice.value) {
      choice.value = { ...choice.value, ...patch };
    }
  }

  /**
   * Подпись выбора.
   * @param value - подпись
   */
  function setChoiceLabel(value: string | number): void {
    patchChoice({ label: String(value) });
  }

  /**
   * Сколько выбрать на уровне умения.
   * @param value - количество
   */
  function setChoiceCount(value: number | null): void {
    patchChoice({ count: Math.max(0, Math.trunc(value ?? 0)) });
  }

  function addStep(): void {
    if (choice.value) {
      patchChoice({
        scaling: [
          ...choice.value.scaling,
          createClassTraitOptionsStep(choice.value, traitLevel),
        ],
      });
    }
  }

  /**
   * Меняет ступень роста количества.
   * @param index - номер ступени
   * @param patch - изменённые поля
   */
  function patchStep(
    index: number,
    patch: Partial<{ level: number; count: number }>,
  ): void {
    patchChoice({
      scaling: (choice.value?.scaling ?? []).map((step, position) =>
        position === index ? { ...step, ...patch } : step,
      ),
    });
  }

  /**
   * Уровень ступени.
   * @param index - номер ступени
   * @param level - уровень
   */
  function setStepLevel(index: number, level: number): void {
    patchStep(index, { level });
  }

  /**
   * Количество ступени.
   * @param index - номер ступени
   * @param value - всего к уровню
   */
  function setStepCount(index: number, value: number | null): void {
    patchStep(index, { count: Math.max(0, Math.trunc(value ?? 0)) });
  }

  /**
   * Убирает ступень.
   * @param index - номер ступени
   */
  function removeStep(index: number): void {
    patchChoice({
      scaling: (choice.value?.scaling ?? []).filter(
        (_, position) => position !== index,
      ),
    });
  }

  /**
   * Переносит в умение записи раздела «Особенности классов» с выбранным
   * типом; варианты с тем же английским названием заменяются.
   */
  async function importType(): Promise<void> {
    if (!optionsType.value) {
      return;
    }

    isImporting.value = true;

    try {
      const imported = classTraitOptionListSchema
        .parse(
          await api(
            `/api/v1/workshop/option-types/${encodeURIComponent(optionsType.value)}/options`,
          ),
        )
        .map(toClassTraitOption);

      if (!imported.length) {
        toast.add({ title: CLASS_OPTIONS_TEXT.importEmpty, color: 'warning' });

        return;
      }

      const names = new Set(
        imported.map((option) => option.englishName.toLowerCase()),
      );

      options.value = [
        ...options.value.filter(
          (option) => !names.has(option.englishName.toLowerCase()),
        ),
        ...imported,
      ];

      if (!optionsName.value) {
        const typeLabel =
          typeItems.find((item) => item.value === optionsType.value)?.label
          ?? '';

        optionsName.value = typeLabel.split(':')[0]?.trim() ?? '';
      }

      isOpen.value = true;

      toast.add({
        title: CLASS_OPTIONS_TEXT.importDone(imported.length),
        color: 'success',
      });
    } catch {
      toast.add({ title: CLASS_OPTIONS_TEXT.importFailed, color: 'error' });
    } finally {
      isImporting.value = false;
    }
  }

  /**
   * Имя поля для ошибок проверки.
   * @param path - путь внутри умения
   */
  function getFieldName(path: string): string {
    return `${fieldName}.${path}`;
  }

  /**
   * Заголовок варианта в списке.
   * @param option - вариант
   */
  function getOptionTitle(option: ClassTraitOption): string {
    return option.name.trim() || CLASS_OPTIONS_TEXT.unnamed;
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex min-w-0 grow cursor-pointer items-center gap-2 text-left"
        :aria-expanded="isOpen"
        @click.left.exact.prevent="toggleSection"
      >
        <UIcon
          name="tabler:chevron-right"
          class="size-4 shrink-0 text-muted transition-transform"
          :class="chevronClass"
        />

        <span class="text-sm font-medium text-highlighted">
          {{ CLASS_OPTIONS_TEXT.title }}
        </span>

        <UBadge
          v-if="options.length"
          :label="String(options.length)"
          color="primary"
          variant="subtle"
          size="sm"
        />
      </button>

      <UTooltip :text="CLASS_OPTIONS_TEXT.hint">
        <UIcon
          name="tabler:info-circle-filled"
          class="size-4 shrink-0 text-muted"
        />
      </UTooltip>

      <UButton
        :label="CLASS_OPTIONS_TEXT.add"
        :icon="CLASS_LIST_ICON.add"
        color="primary"
        variant="soft"
        size="xs"
        @click.left.exact.prevent="addOption"
      />
    </div>

    <div
      v-if="isOpen"
      class="flex flex-col gap-3 pl-6"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
        <UFormField
          :label="CLASS_OPTIONS_TEXT.type"
          :help="CLASS_OPTIONS_TEXT.typeHint"
        >
          <USelectMenu
            :model-value="optionsType || NO_TYPE"
            :items="typeSelectItems"
            value-key="value"
            class="w-full"
            @update:model-value="setType"
          />
        </UFormField>

        <UFormField
          :label="CLASS_OPTIONS_TEXT.name"
          :name="getFieldName('optionsName')"
        >
          <UInput
            v-model="optionsName"
            :placeholder="CLASS_OPTIONS_TEXT.namePlaceholder"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-start md:pt-6">
          <UTooltip :text="CLASS_OPTIONS_TEXT.importHint">
            <UButton
              :label="CLASS_OPTIONS_TEXT.import"
              icon="tabler:download"
              color="neutral"
              variant="subtle"
              size="sm"
              :disabled="!optionsType"
              :loading="isImporting"
              @click.left.exact.prevent="importType"
            />
          </UTooltip>
        </div>
      </div>

      <div class="flex flex-col gap-2 rounded-lg border border-default p-3">
        <UCheckbox
          :model-value="isSelectable"
          :label="CLASS_OPTIONS_TEXT.selectable"
          :description="CLASS_OPTIONS_TEXT.selectableHint"
          @update:model-value="setSelectable"
        />

        <template v-if="choice">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_10rem]">
            <UFormField :label="CLASS_OPTIONS_TEXT.choiceLabel">
              <UInput
                :model-value="choice.label"
                :placeholder="CLASS_OPTIONS_TEXT.choiceLabelPlaceholder"
                class="w-full"
                @update:model-value="setChoiceLabel"
              />
            </UFormField>

            <UFormField
              :label="CLASS_OPTIONS_TEXT.count"
              :help="CLASS_OPTIONS_TEXT.countHint"
              :name="getFieldName('optionsChoice.count')"
            >
              <UInputNumber
                :model-value="choice.count"
                :min="0"
                class="w-full"
                @update:model-value="setChoiceCount"
              />
            </UFormField>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-toned">
              {{ CLASS_OPTIONS_TEXT.stepsTitle }}
            </span>

            <UTooltip :text="CLASS_OPTIONS_TEXT.stepsHint">
              <UIcon
                name="tabler:info-circle"
                class="size-4 text-muted"
              />
            </UTooltip>

            <UButton
              :label="CLASS_OPTIONS_TEXT.addStep"
              :icon="CLASS_LIST_ICON.add"
              color="neutral"
              variant="ghost"
              size="xs"
              class="ml-auto"
              @click.left.exact.prevent="addStep"
            />
          </div>

          <div
            v-for="(step, stepIndex) in choice.scaling"
            :key="stepIndex"
            class="grid grid-cols-[8rem_8rem_auto] items-end gap-3"
          >
            <UFormField :label="CLASS_OPTIONS_TEXT.stepLevel">
              <USelect
                :model-value="step.level"
                :items="levelItems"
                class="w-full"
                @update:model-value="setStepLevel(stepIndex, $event)"
              />
            </UFormField>

            <UFormField :label="CLASS_OPTIONS_TEXT.stepCount">
              <UInputNumber
                :model-value="step.count"
                :min="0"
                class="w-full"
                @update:model-value="setStepCount(stepIndex, $event)"
              />
            </UFormField>

            <UButton
              icon="tabler:trash"
              color="error"
              variant="ghost"
              size="xs"
              class="mb-1 justify-self-start"
              :aria-label="CLASS_OPTIONS_TEXT.removeStep"
              @click.left.exact.prevent="removeStep(stepIndex)"
            />
          </div>
        </template>
      </div>

      <p
        v-if="!options.length"
        class="text-xs text-dimmed"
      >
        {{ CLASS_OPTIONS_TEXT.empty }}
      </p>

      <WorkshopCollapsibleItem
        v-for="(option, index) in options"
        :key="index"
        :title="getOptionTitle(option)"
        :is-open="isExpanded(index)"
        :remove-label="CLASS_OPTIONS_TEXT.remove"
        @toggle="toggle(index)"
        @remove="removeOption(index)"
      >
        <template #leading>
          <UBadge
            v-if="option.level"
            :label="String(option.level)"
            color="neutral"
            variant="outline"
            size="sm"
            class="shrink-0 tabular-nums"
          />
        </template>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <UFormField
            :label="CLASS_OPTIONS_TEXT.optionName"
            :name="getFieldName(`options.${index}.name`)"
            required
          >
            <UInput
              :model-value="option.name"
              class="w-full"
              @update:model-value="setOptionText(index, 'name', $event)"
            />
          </UFormField>

          <UFormField
            :label="CLASS_OPTIONS_TEXT.optionEnglishName"
            :name="getFieldName(`options.${index}.englishName`)"
            required
          >
            <UInput
              :model-value="option.englishName"
              class="w-full"
              @update:model-value="setOptionText(index, 'englishName', $event)"
            />
          </UFormField>

          <UFormField :label="CLASS_OPTIONS_TEXT.optionAltName">
            <UInput
              :model-value="option.altName"
              class="w-full"
              @update:model-value="setOptionText(index, 'altName', $event)"
            />
          </UFormField>

          <UFormField :label="CLASS_OPTIONS_TEXT.optionLevel">
            <USelect
              :model-value="option.level ?? 0"
              :items="optionLevelItems"
              class="w-full"
              @update:model-value="setOptionLevel(index, $event)"
            />
          </UFormField>

          <UFormField
            :label="CLASS_OPTIONS_TEXT.prerequisite"
            class="md:col-span-2"
          >
            <UInput
              :model-value="option.prerequisite"
              :placeholder="CLASS_OPTIONS_TEXT.prerequisitePlaceholder"
              class="w-full"
              @update:model-value="setOptionText(index, 'prerequisite', $event)"
            />
          </UFormField>

          <UFormField :label="CLASS_OPTIONS_TEXT.additional">
            <UInput
              :model-value="option.additional"
              :placeholder="CLASS_OPTIONS_TEXT.additionalPlaceholder"
              class="w-full"
              @update:model-value="setOptionText(index, 'additional', $event)"
            />
          </UFormField>

          <UFormField :label="CLASS_OPTIONS_TEXT.source">
            <UInput
              :model-value="option.source"
              :placeholder="CLASS_OPTIONS_TEXT.sourcePlaceholder"
              class="w-full"
              @update:model-value="setOptionText(index, 'source', $event)"
            />
          </UFormField>

          <UFormField :label="CLASS_OPTIONS_TEXT.page">
            <UInputNumber
              :model-value="option.page ?? undefined"
              :min="1"
              class="w-full"
              @update:model-value="setOptionPage(index, $event)"
            />
          </UFormField>

          <div class="col-span-full flex flex-wrap gap-x-6 gap-y-2">
            <UCheckbox
              :model-value="option.repeatable"
              :label="CLASS_OPTIONS_TEXT.repeatable"
              @update:model-value="setOptionFlag(index, 'repeatable', $event)"
            />

            <UCheckbox
              v-if="hasHideInSubclasses"
              :model-value="option.hideInSubclasses"
              :label="CLASS_OPTIONS_TEXT.hideInSubclasses"
              @update:model-value="
                setOptionFlag(index, 'hideInSubclasses', $event)
              "
            />
          </div>

          <UFormField
            :label="CLASS_OPTIONS_TEXT.description"
            class="col-span-full"
          >
            <MarkupEditor
              :model-value="option.description"
              @update:model-value="setOptionDescription(index, $event)"
            />
          </UFormField>

          <div class="col-span-full">
            <WorkshopTraitMechanics
              :mechanics="option.mechanics"
              :active-effects="option.activeEffects"
              :kind="MECHANICS_KIND.class"
              @update:mechanics="setOptionMechanics(index, $event)"
              @update:active-effects="setOptionEffects(index, $event)"
            />
          </div>
        </div>
      </WorkshopCollapsibleItem>
    </div>
  </div>
</template>
