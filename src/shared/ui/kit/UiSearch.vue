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
    <input
      ref="input"
      v-model="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="$style.input"
      @click="inputFocus = true"
    />

    <div :class="$style.container">
      <span
        v-show="inputValue.length > 0"
        :class="[$style.icon, $style['cursor-pointer']]"
        @click="clearInput"
      >
        <svg-icon icon="close" />
      </span>

      <span :class="$style.icon">
        <svg-icon icon="search" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useElementHover, useFocus } from '@vueuse/core';
  import { ref, toRefs, watch } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  const props = withDefaults(
    defineProps<{
      disabled: boolean;
      placeholder: string;
      isFocused: boolean;
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

  watch(isFocused, () => {
    if (isFocused.value) inputFocus.value = true;
  });
</script>

<style lang="scss" module>
  .ui-search.focused {
    border-color: var(--primary);
  }

  .ui-search.hovered {
    border-color: var(--border-hover);
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .disabled {
    opacity: 0.6;
  }

  .ui-search {
    min-width: 230px;
    width: 280px;
    background-color: var(--bg-sub-menu);
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
  }

  .input {
    padding: 0;
    border: none;
    outline: none;
    background-color: inherit;
    color: var(--text-color);
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
  .icon {
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
