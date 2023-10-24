<template>
  <div class="ui-select">
    <div
      v-if="$slots.label"
      class="ui-select__label"
    >
      <slot name="label" />
    </div>

    <div
      ref="dropdownHeader"
      :class="[
        'ui-select__wrapper',
        { 'ui-select__wrapper--disabled': disabled }
      ]"
      @focusin="toggleFocus"
    >
      <div class="ui-select__input-wrapper">
        <ui-input
          ref="input"
          v-model="filter"
          :disabled="disabled"
          :placeholder="togglePlaceholder"
        />

        <div
          v-if="selectedOptions.length && !focused"
          class="ui-select__selected"
          @click="toggleFocus"
        >
          {{ displaySelectedOptions }}
        </div>
      </div>

      <div
        :class="[
          'ui-select__select',
          { 'ui-select__select--disabled': disabled }
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
          :key="option.value"
          :class="[
            'ui-select__element',
            { 'ui-select__element--selected': isSelectedClass(option.value) }
          ]"
          @click="selectOption(option.value)"
        >
          <span class="ui-select__option">
            {{ option.name }}
          </span>
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

<script setup lang="ts">
  import { onClickOutside } from '@vueuse/core';
  import { intersectionBy, xor } from 'lodash-es';
  import { computed, ref, watch } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';

  const modelValue = defineModel<Array<string | number>>();

  const props = defineProps({
    placeholder: {
      type: String,
      default: ''
    },
    options: {
      type: Array<{
        value: string | number;
        name: String;
      }>,
      default: () => []
    },
    isMultiple: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  });

  const input = ref<typeof UiInput | null>(null);
  const dropdownHeader = ref<HTMLDivElement | null>(null);
  const focused = ref<Boolean>(false);
  const filter = ref<string>('');
  const selectedOptions = ref<Array<string | number>>([]);

  onClickOutside(dropdownHeader, () => {
    focused.value = false;
  });

  const toggleFocus = (e: Event) => {
    if (e.type === 'focusin') {
      focused.value = true;
    }

    if (e.type === 'click') {
      focused.value = !focused.value;

      if (focused.value) {
        input.value?.focusInput();
      }
    }
  };

  const togglePlaceholder = computed(() =>
    focused.value || selectedOptions.value.length ? '' : props.placeholder
  );

  const toggleIcon = computed(() =>
    focused.value ? 'arrow/up' : 'arrow/down'
  );

  const isSelectedClass = (option: string | number) => {
    return selectedOptions.value.includes(option);
  };

  const selectOption = (option: string | number) => {
    if (props.isMultiple) {
      selectedOptions.value = xor(selectedOptions.value, [option]);
    } else {
      selectedOptions.value[0] = option;
    }

    modelValue.value = selectedOptions.value;
  };

  const displaySelectedOptions = computed(() => {
    const mappedOptions = selectedOptions.value.map(el => ({ value: el }));

    const optionsToDisplay = intersectionBy(
      props.options,
      mappedOptions,
      'value'
    );

    return optionsToDisplay.map(el => el.name).join(', ');
  });

  watch(focused, f => {
    if (!f) {
      filter.value = '';
    }
  });

  watch(modelValue, mv => {
    if (!mv) {
      selectedOptions.value = [];
    }
  });

  const filteredOptions = computed(() =>
    props.options.filter(el => {
      if (!filter.value) {
        return el;
      }

      return el.name.toLowerCase().includes(String(filter.value));
    })
  );
</script>

<style lang="scss" scoped>
  .ui-select {
    &__label {
      margin-bottom: 8px;
      padding: 0 8px;
    }

    &__selected {
      position: absolute;
      padding: 11px;
      top: 0;
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
      padding: 11px;
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
    &__input-wrapper {
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

      &-wrapper {
        background: var(--bg-secondary);
        color: var(--text-color);
        font-size: var(--main-font-size);
        line-height: var(--main-line-height);
        position: absolute;
        max-height: calc(43.2px * 5);
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
      padding: 12px 12px 12px 28px;

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
    }

    &__option {
      color: var(--text-color);
      width: 100%;

      span {
        white-space: break-spaces;
        width: 100%;
        display: block;
      }

      &--group {
        background: var(--bg-sub-menu);
        color: var(--text-color);
        font-weight: 600;
      }

      &--disabled {
        background: var(--hover) !important;
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
