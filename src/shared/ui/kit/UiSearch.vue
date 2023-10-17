<template>
  <div
    ref="container"
    :class="{
      [$style['ui-search']]: true,
      [$style.focused]: inputFocus,
      [$style.hovered]: !disabled && isHovered,
      [$style.disabled]: disabled
    }"
    @click="inputFocus = true"
  >
    <div
      v-if="disabled"
      :class="$style.wrapper"
    />

    <input
      ref="input"
      v-model="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="$style.input"
      @click="inputFocus = true"
    />

    <div :class="$style.container">
      <button
        v-show="inputValue.length > 0"
        type="button"
        :class="$style.button"
        :disabled="disabled"
        @click.prevent="clearInput"
      >
        <svg-icon icon="close" />
      </button>

      <button
        type="button"
        :class="$style.button"
        :disabled="disabled"
        @click.prevent="handleSearch"
      >
        <svg-icon icon="search" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useElementHover, useFocus } from '@vueuse/core';
  import { debounce } from 'lodash-es';
  import { ref, toRefs, watch } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      placeholder?: string;
      isFocused?: boolean;
      onSearch: () => void;
    }>(),
    {
      disabled: false,
      placeholder: 'Поиск...',
      isFocused: false
    }
  );

  const { disabled, placeholder, isFocused } = toRefs(props);
  const inputValue = defineModel<string>({ required: true });
  const container = ref<HTMLDivElement | null>(null);
  const input = ref<HTMLInputElement | null>(null);
  const isHovered = useElementHover(container);
  const { focused: inputFocus } = useFocus(input);

  const clearInput = () => {
    inputValue.value = '';
  };

  const handleSearch = debounce(props.onSearch, 300);

  watch(isFocused, () => {
    inputFocus.value = isFocused.value;
  });
</script>

<style lang="scss" module>
  .ui-search.focused {
    border-color: var(--primary);
  }

  .ui-search.hovered {
    border-color: var(--border-hover);
  }

  .ui-search.disabled {
    button {
      cursor: default;
    }
  }

  .wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bg-light-main);
  }

  .ui-search {
    position: relative;
    overflow: hidden;
    min-width: 230px;
    width: 280px;
    background-color: var(--bg-sub-menu);
    color: var(--text-color);
    padding: 8px 8px;
    height: fit-content;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: var(--border);

    @include media-min($md) {
      padding: 10px 12px;
      border-radius: 12px;
    }

    @include media-min($lg) {
      padding: 12px 16px;
      border-radius: 12px;
    }

    @include media-min($xl) {
      padding: 16px 16px;
      border-radius: 16px;
    }

    button {
      padding: 0;
      color: inherit;

      svg {
        color: var(--text-g-color);
      }
    }
  }

  .input {
    padding: 0;
    border: none;
    outline: none;
    background-color: inherit;
    color: inherit;
    width: 100%;
    font-size: var(--main-font-size);
    line-height: var(--main-line-height);

    @include media-min($lg) {
      font-size: calc(var(--main-font-size) + 2px);
    }
  }

  .container {
    display: flex;
    align-items: center;
  }

  .button {
    svg {
      width: 20px;
      height: 20px;

      @include media-min($md) {
        width: 24px;
        height: 24px;
      }
    }
  }
</style>
