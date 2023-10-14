<template>
  <div
    class="ui-select"
    style="width: 15%;"
  >
    <div
      v-if="$slots.label"
      class="ui-select__label"
    >
      <slot name="label" />
    </div>

    <div
      ref="dropdownHeader"
      class="ui-select__wrapper"
      @focusin="toggleFocus"
    >
      <ui-input
        ref="input"
        :placeholder="togglePlaceholder"
        @update:model-value="onSearch"
      />

      <div
        class="ui-select__select"
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
          :key="option.url"
          class="ui-select__element"
          @click="selectOption($event)"
        >
          <span class="ui-select__option">
            {{ option.name.rus }}
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
  import { computed, ref } from 'vue';
  import { onClickOutside } from '@vueuse/core';
  import UiInput from '@/components/UI/kit/UiInput.vue';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

  const props = defineProps({
    placeholder: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    }
  });

  const input = ref(null);
  const dropdownHeader = ref(null);
  const focused = ref<Boolean>(false);
  const filter = ref<String>('');

  onClickOutside(dropdownHeader, () => {
    focused.value = false;
  });

  const toggleFocus = e => {
    if (e.type === 'focusin') {
      focused.value = true;
    }

    if (e.type === 'click') {
      focused.value = !focused.value;

      if (focused.value) {
        input.value.focusInput();
      }
    }

    filter.value = '';
  };

  const togglePlaceholder = computed(() => (focused.value ? '' : props.placeholder));

  const toggleIcon = computed(() => (focused.value ? 'arrow/up' : 'arrow/down'));

  const selectOption = e => {
    let el = e.target;

    if (el.tagName === 'SPAN') {
      el = el.parentElement;
    }

    el.classList.toggle('ui-select__element--selected');
  };

  const onSearch = (e: string) => {
    filter.value = e;
  };

  const filteredOptions = computed(() => props.options?.filter(el => {
    if (!filter.value) {
      return el;
    }

    return el.name.rus.toLowerCase().includes(filter.value);
  }));
</script>

<style lang="scss" scoped>
.ui-select {
  &__label {
    margin-bottom: 8px;
    padding: 0 8px;
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

    svg {
      @include css_anim();

      color: var(--primary);
    }
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
    cursor: pointer;
    min-height: 38px;
    border: {
      width: 1px;
      style: solid;
      color: var(--border);
      radius: 8px;
    };
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
          &:hover, &--highlight {
            color: var(--text-btn-color);
            background: var(--primary-hover);
          }
        }
      }
    }

    &--empty {
      cursor: default;
      &:hover {
        background: none  ;
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
