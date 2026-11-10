<script
  setup
  lang="ts"
  generic="TValue extends string, TOption extends DisplaySettingsOption<TValue>"
>
  import type {
    DisplaySettingsChoiceShape,
    DisplaySettingsOption,
  } from './types';

  import {
    DISPLAY_SETTINGS_CHOICE_FIELDSET_CLASS,
    DISPLAY_SETTINGS_CHOICE_ITEM_CLASS,
    DISPLAY_SETTINGS_CHOICE_LABEL_CLASS,
    DISPLAY_SETTINGS_CHOICE_WRAPPER_CLASS,
  } from './constants';

  /**
   * Одна настройка панели отображения: варианты плитками с картинкой из
   * слота `preview` или пилюлями со значком и названием. У плиток выбранный
   * вариант назван словами справа от названия настройки. Там же — пояснение,
   * почему часть вариантов недоступна.
   */
  const {
    title,
    options,
    shape = 'tile',
    hint = undefined,
  } = defineProps<{
    /** Название настройки */
    title: string;
    /** Варианты */
    options: ReadonlyArray<TOption>;
    /** Плитки или пилюли */
    shape?: DisplaySettingsChoiceShape;
    /** Пояснение вместо выбранного варианта: почему часть недоступна */
    hint?: string;
  }>();

  defineSlots<{
    /** Картинка плитки */
    preview?: (props: { option: TOption }) => unknown;
  }>();

  const model = defineModel<TValue>({ required: true });

  // Кнопки знают значения просто строками: тип варианта возвращает `select`
  const items = computed<Array<DisplaySettingsOption<string>>>(() =>
    options.map((option) => ({
      value: option.value,
      label: option.label,
      icon: shape === 'pill' ? option.icon : undefined,
      disabled: option.disabled,
    })),
  );

  const selectedValue = computed<string>(() => model.value);

  // Пояснение о недоступности — тусклее названия выбранного варианта
  const headerLabelClass = computed(() =>
    hint ? 'text-dimmed' : 'text-muted',
  );

  // У пилюль название и так на кнопке — повторять его в шапке незачем
  const headerLabel = computed(() =>
    shape === 'tile'
      ? options.find((option) => option.value === model.value)?.label
      : undefined,
  );

  /**
   * Вариант по значению кнопки — списком из одного элемента, чтобы шаблон
   * получил его без проверки на пустоту.
   *
   * @param value Значение кнопки.
   * @returns Найденный вариант или пустой список.
   */
  function matchOptions(value: unknown): Array<TOption> {
    return options.filter((entry) => entry.value === value);
  }

  /**
   * Принимает выбор кнопки. Значение ищется среди вариантов, чтобы наружу
   * ушёл вариант нужного типа.
   *
   * @param value Значение выбранной кнопки.
   */
  function select(value: unknown): void {
    const [option] = matchOptions(value);

    if (option) {
      model.value = option.value;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-2 text-sm">
      <span class="font-medium text-default">{{ title }}</span>

      <span
        class="truncate text-xs"
        :class="headerLabelClass"
      >
        {{ hint ?? headerLabel }}
      </span>
    </div>

    <URadioGroup
      :model-value="selectedValue"
      :items="items"
      :legend="title"
      variant="card"
      orientation="horizontal"
      indicator="hidden"
      size="md"
      :ui="{
        legend: 'sr-only',
        fieldset: DISPLAY_SETTINGS_CHOICE_FIELDSET_CLASS[shape],
        item: [
          DISPLAY_SETTINGS_CHOICE_ITEM_CLASS[shape],
          'cursor-pointer has-disabled:cursor-not-allowed',
        ],
        wrapper: DISPLAY_SETTINGS_CHOICE_WRAPPER_CLASS[shape],
        label: DISPLAY_SETTINGS_CHOICE_LABEL_CLASS[shape],
        icon: 'size-4',
      }"
      @update:model-value="select"
    >
      <template #label="{ item }">
        <template v-if="shape === 'pill'">
          {{ item.label }}
        </template>

        <span
          v-else
          class="sr-only"
        >
          {{ item.label }}
        </span>

        <span
          v-if="shape === 'tile'"
          :title="item.label"
          class="block w-full"
        >
          <template
            v-for="option in matchOptions(item.value)"
            :key="option.value"
          >
            <slot
              name="preview"
              :option="option"
            />
          </template>
        </span>
      </template>
    </URadioGroup>
  </div>
</template>
