<script setup lang="ts" generic="T">
  import { onClickOutside } from '@vueuse/core';
  import { cloneDeep, get, isEqual } from 'lodash-es';
  import { computed, ref, watch } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';

  const modelValue = defineModel<T>();

  const props = defineProps<{
    label: string;
    trackBy: string;
    options: Array<T>;
    disabled?: boolean;
    headerLabel?: string | number;
    placeholder: string | number;
    isMultiple?: boolean;
    isSearchable?: boolean;
    isGrouped?: boolean;
    groupLabel?: string;
    groupValues?: string;
  }>();

  const input = ref<typeof UiInput>();
  const header = ref<HTMLDivElement>();
  const focused = ref(false);
  const filter = ref('');

  onClickOutside(header, () => {
    focused.value = false;
  });

  const toggleFocus = (e: Event) => {
    if (e.type === 'focusin') focused.value = true;

    if (e.type === 'click') {
      focused.value = !focused.value;

      if (focused.value) input.value?.focusInput();
    }
  };

  const toggleIcon = computed(() =>
    focused.value ? 'arrow/up' : 'arrow/down',
  );

  const isSelectedClass = (option: T) =>
    String(get(option, props.label)) === String(props.placeholder) ||
    isEqual(modelValue.value, option);

  const selectOption = (option: T) => {
    modelValue.value = cloneDeep(option);
  };

  const displaySelectedOptions = computed(() =>
    get(modelValue.value, props.label),
  );

  watch(focused, (isFocused) => {
    if (!isFocused) filter.value = '';
  });

  const filteredOptions = computed(() => {
    let newOptions: Array<T> = [];

    if (props.isGrouped) {
      newOptions = props.options.reduce(
        (res, el) => [
          ...res,
          { ...el[props.groupLabel], groupLabel: true },
          ...el[props.groupValues],
        ],
        newOptions,
      );
    } else {
      newOptions = props.options.filter((el) => {
        const optionLabel = String(get(el, props.label)).toUpperCase();
        const currentFilter = String(filter.value).toUpperCase();

        return optionLabel.includes(currentFilter);
      });
    }

    return newOptions;
  });
</script>

<template>
  <div class="ui-select">
    <div
      v-if="$slots.label"
      class="ui-select__label"
    >
      {{ props.headerLabel }}
    </div>

    <div
      ref="header"
      :class="[
        'ui-select__wrapper',
        { 'ui-select__wrapper--disabled': props.disabled },
      ]"
      @focusin="toggleFocus"
    >
      <div
        v-if="$slots['left-slot']"
        class="ui-select__slotted--left"
      >
        <slot name="left-slot" />
      </div>

      <div class="ui-select__slotted-wrapper">
        <div class="ui-select__slotted--body">
          <div
            v-if="!focused || !props.isSearchable"
            class="ui-select__placeholder"
            @click="toggleFocus"
          >
            {{ modelValue ? displaySelectedOptions : props.placeholder }}
          </div>

          <ui-input
            v-if="focused && props.isSearchable"
            ref="input"
            v-model="filter"
            :disabled="props.disabled"
            autofocus
          />
        </div>
      </div>

      <div
        v-if="$slots['right-slot']"
        class="ui-select__slotted--right"
      >
        <slot name="right-slot" />
      </div>

      <div
        :class="[
          'ui-select__select',
          { 'ui-select__select--disabled': props.disabled },
        ]"
        @click="toggleFocus"
      >
        <svg-icon :icon="toggleIcon" />
      </div>
    </div>

    <div
      v-if="focused"
      class="ui-select__content-wrapper"
    >
      <ul class="ui-select__content">
        <li
          v-for="option in filteredOptions"
          :key="get(option, props.trackBy)"
          :class="{
            'ui-select__element': true,
            'ui-select__element--selected': isSelectedClass(option),
            'ui-select__element--disabled': option.groupLabel,
          }"
          @click="selectOption(option)"
        >
          <slot
            name="option"
            v-bind="option"
          >
            <span class="ui-select__option">
              {{ get(option, props.label) }}
            </span>
          </slot>
        </li>

        <li
          v-if="filteredOptions.length === 0"
          class="ui-select__element ui-select__element--empty"
        >
          Боги не знают ответа на твой запрос
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .ui-select {
    &__label {
      margin-bottom: 8px;
      padding: 0 8px;
    }

    &__placeholder {
      height: 100%;
      padding: 8px;
      width: 100%;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    &__select {
      @include css_anim();

      width: 38px;
      min-height: 100%;
      max-height: 100%;
      height: initial;
      padding: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: static;
      flex-shrink: 0;
      top: initial;
      right: initial;
      border-radius: 0 8px 8px 0;

      &:hover {
        background-color: var(--hover);
      }

      &:before {
        display: none;
      }

      &--disabled {
        background: var(--hover) !important;
      }

      svg {
        @include css_anim();

        color: var(--primary);
      }
    }

    &__slotted-wrapper {
      position: relative;
      cursor: pointer;
      width: 100%;
    }

    &__wrapper {
      @include css_anim();

      box-sizing: border-box;
      outline: none;
      appearance: none;
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: row;
      background: var(--bg-sub-menu);
      min-height: 38px;
      overflow: hidden;
      border: {
        width: 1px;
        style: solid;
        color: var(--border);
        radius: 8px;
      }

      &--disabled {
        pointer-events: none;
        opacity: 0.6;
      }
    }

    &__content {
      width: 100%;
      padding: 0;
      margin: 0;
      white-space: nowrap;

      &-wrapper {
        background: var(--bg-secondary);
        color: var(--text-color);
        font-size: var(--main-font-size);
        line-height: var(--main-line-height);
        position: absolute;
        max-height: calc(43.2px * 6);
        overflow: auto;
        bottom: auto;
        margin: 5px 0 0;
        border: 1px solid var(--border);
        border-radius: 8px;
        z-index: 3;
      }
    }

    &__element {
      list-style: none;
      width: 100%;
      cursor: pointer;
      margin-bottom: initial;
      line-height: initial;
      padding: 12px 18px 12px 28px;

      &:hover {
        background: var(--hover);
        color: var(--text-color);

        &:after {
          background: transparent;
        }
      }

      &--selected {
        font-weight: 400;
        color: var(--text-color-active);
        background: var(--hover);

        &.ui-select {
          &__element {
            &:hover,
            &--highlight {
              color: var(--text-btn-color);
              background: var(--primary-hover);
            }
          }
        }
      }

      &--empty {
        cursor: default;

        &:hover {
          background: none;
        }
      }

      &--disabled {
        color: #a6a6a6 !important;
        cursor: text;
        pointer-events: none;
        background: var(--hover) !important;
        font-weight: 600;
      }
    }

    &__option {
      color: var(--text-color);
      width: 100%;

      span {
        white-space: break-spaces;
        width: 100%;
        display: block;
      }
    }

    &__slotted {
      display: flex;
      height: 100%;
      min-height: 36px;

      &--left,
      &--right {
        padding: 8px;
        background-color: var(--primary);
        color: var(--text-btn-color);
        font-size: var(--main-font-size);
        line-height: calc(var(--main-line-height) + 1px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-weight: 600;
        min-width: 38px;
      }

      &--body {
        min-width: 38px;
      }
    }
  }

  :deep(.ui-input__input) {
    color: var(--text-color-active);
    cursor: pointer;

    &[placeholder=''] {
      cursor: text;
    }
  }

  :deep(.ui-input__control) {
    border: none;
  }
</style>
