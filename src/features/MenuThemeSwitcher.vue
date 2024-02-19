<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { ref } from 'vue';

  import { useUIStore } from '@/shared/stores/UIStore';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import type { TButtonType } from '@/shared/ui/kit/button/UiButton';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import type { BasicColorSchema } from '@vueuse/core';

  const uiStore = useUIStore();
  const { theme, storedTheme } = storeToRefs(uiStore);
  const popover = ref<boolean>(false);

  const getButtonType = (name: BasicColorSchema): TButtonType =>
    storedTheme.value === name ? 'default' : 'secondary';
</script>

<template>
  <nav-popover v-model="popover">
    <template #trigger="{ isActive }">
      <div @click="popover = !popover">
        <div
          class="navbar__btn"
          :class="{ 'is-active': isActive }"
        >
          <svg-icon :icon="`theme/${theme}`" />
        </div>
      </div>
    </template>

    <template #default>
      <div :class="$style.container">
        <div :class="$style.title">
          <span :class="$style.text"> Переключение темы </span>
        </div>

        <div :class="$style.wrapper">
          <ui-button
            :type="getButtonType('auto')"
            @click.left.exact.prevent="storedTheme = 'auto'"
            >Авто</ui-button
          >

          <ui-button
            :type="getButtonType('light')"
            @click.left.exact.prevent="storedTheme = 'light'"
            >Светлая</ui-button
          >

          <ui-button
            :type="getButtonType('dark')"
            @click.left.exact.prevent="storedTheme = 'dark'"
            >Тёмная</ui-button
          >
        </div>
      </div>
    </template>
  </nav-popover>
</template>

<style lang="scss" module>
  .title {
    @include css_anim();

    display: flex;
    align-items: center;
    justify-content: flex-start;
    background-color: var(--bg-sub-menu);
    color: var(--text-color-title);
    cursor: default;
  }

  .text {
    padding: 12px;
    color: inherit;
  }

  .wrapper {
    display: flex;
    justify-content: flex-start;
    padding: 10px;
  }

  .button {
    @include css_anim();
    width: 85px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--border);
    border-radius: 8px;
    color: var(--text-color-title);
    background-color: var(--bg-transparent);

    &:hover {
      border-color: var(--primary-hover);
    }
  }

  .is-active {
    background-color: var(--hover);
  }

  .selected {
    background-color: var(--bg-theme-selected);
    color: var(--bg-main);
    border: none;
  }
</style>
