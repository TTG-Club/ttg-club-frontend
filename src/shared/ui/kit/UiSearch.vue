<template>
  <div
    ref="container"
    :class="{
      [$style['ui-search']]: true,
      [$style['focused']]: inputFocus,
      [$style['hovered']]: !disabled && isHovered,
      [$style['disabled']]: disabled
    }"
    @click="inputFocus = true"
  >
    <input
      ref="input"
      v-model="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="$style['ui-search__input']"
      @click="inputFocus = true"
    />

    <div :class="$style['ui-search__container']">
      <span
        v-show="inputValue.length > 0"
        :class="[
          $style['ui-search__container--icon'],
          $style['cursor-pointer']
        ]"
        @click="clearInput"
      >
        <svg-icon icon="close" />
      </span>

      <span :class="$style['ui-search__container--icon']">
        <svg-icon icon="search" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useElementHover, useFocus, useVModel } from '@vueuse/core';
  import { ref } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  type Emit = {
    (e: 'update:modelValue', value: string): void;
  };

  const emit = defineEmits<Emit>();

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      disabled: boolean;
      placeholder: string;
    }>(),
    {
      modelValue: '',
      disabled: false,
      placeholder: 'Placeholder'
    }
  );

  const { disabled, placeholder } = props;
  const container = ref<HTMLDivElement | null>(null);
  const input = ref<HTMLInputElement | null>(null);
  const isHovered = useElementHover(container);
  const { focused: inputFocus } = useFocus(input, { initialValue: false });
  const inputValue = useVModel(props, 'modelValue', emit);

  const clearInput = () => {
    inputValue.value = '';
  };
</script>

<style lang="scss" module>
  .ui-search.focused {
    border-color: var(--border-active);
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

    &__input {
      padding: 0;
      border: none;
      outline: none;
      background-color: inherit;
      color: var(--text-color);
      width: 100%;
      font-size: 14px;
      @include media-min($lg) {
        font-size: 16px;
      }
    }

    &__container {
      display: flex;
      align-items: center;

      &--icon {
        svg {
          width: 20px;
          height: 20px;
          @include media-min($md) {
            width: 24px;
            height: 24px;
          }
        }
      }
    }
  }
</style>
