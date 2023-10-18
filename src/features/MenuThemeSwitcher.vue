<template>
  <nav-popover v-model="popover">
    <template #trigger="{ isActive }">
      <div @click="popover = !popover">
        <div
          class="navbar__btn"
          :class="{
            ['is-active']: isActive
          }"
        >
          <svg-icon :icon="`theme/${uiStore.theme}`" />
        </div>
      </div>
    </template>

    <template #default>
      <div class="theme__container">
        <div class="title">
          <span class="text"> Тема </span>
        </div>

        <div class="theme__wrapper">
          <button
            type="button"
            class="button"
            :class="{
              selected: uiStore.themePreference === ThemePreference.auto
            }"
            @click.left.exact.prevent="setThemePreference(ThemePreference.auto)"
          >
            <span class="text"> Авто </span>
          </button>

          <button
            type="button"
            class="button"
            :class="{
              selected: uiStore.themePreference === ThemePreference.light
            }"
            @click.left.exact.prevent="
              setThemePreference(ThemePreference.light)
            "
          >
            <span class="text"> Светлая </span>
          </button>

          <button
            type="button"
            class="button"
            :class="{
              selected: uiStore.themePreference === ThemePreference.dark
            }"
            @click.left.exact.prevent="setThemePreference(ThemePreference.dark)"
          >
            <span class="text"> Тёмная </span>
          </button>
        </div>
      </div>
    </template>
  </nav-popover>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import { useUIStore } from '@/shared/stores/UIStore';
  import { ThemePreference } from '@/shared/types/Theme';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  const popover = ref<boolean>(false);

  const uiStore = useUIStore();

  const setThemePreference = async (preference: ThemePreference) => {
    if (uiStore.themePreference === preference) return;
    await uiStore.setThemePreference(preference);
  };
</script>

<style lang="scss" scoped>
  .navbar__header_right .nav-popover__body {
    width: fit-content;
  }
  .navbar__btn {
    @include css_anim();

    cursor: pointer;
    height: 40px;
    width: 40px;
    border-radius: 8px;
    padding: 6px;
    display: flex;
    align-items: center;
    color: var(--text-color);

    &:hover {
      color: var(--text-b-color);
      background-color: var(--hover);
    }
  }
  .theme__container {
    width: 100vw;
    max-width: 300px;

    .title {
      @include css_anim();
      display: flex;
      align-items: center;
      justify-content: flex-start;
      background-color: var(--bg-sub-menu);
      cursor: default;
      .text {
        padding: 12px;
        color: var(--text-color-title);
      }
    }
  }

  .theme__wrapper {
    display: flex;
    padding: 10px;
    gap: 8px;
    .button {
      @include css_anim();
      width: 85px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      border: 2px solid var(--border);
      border-radius: 8px;
      color: var(--text-color-title);
      background-color: var(--bg-transparent);

      &:hover {
        border-color: var(--primary-hover);
      }
      .text {
        color: inherit;
      }
    }
  }

  .is-active {
    background-color: var(--hover);
  }

  .button.selected {
    background-color: var(--bg-theme-selected);
    color: var(--bg-main);
    border: none;
  }
</style>
