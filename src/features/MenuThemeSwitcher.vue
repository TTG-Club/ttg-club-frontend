<script setup lang="ts">
  import { useUIStore } from '@/shared/stores/UIStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import type { BasicColorSchema } from '@vueuse/core';

  const uiStore = useUIStore();
  const { theme, storedTheme } = storeToRefs(uiStore);
  const popover = ref<boolean>(false);

  const getButtonType = (name: BasicColorSchema) =>
    storedTheme.value === name ? 'primary' : 'default';
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
      <n-flex
        vertical
        size="large"
        :class="$style.container"
      >
        <span :class="$style.text"> Переключение темы </span>

        <n-flex :wrap="false">
          <n-button
            :type="getButtonType('auto')"
            @click.left.exact.prevent="storedTheme = 'auto'"
          >
            Авто
          </n-button>

          <n-button
            :type="getButtonType('light')"
            @click.left.exact.prevent="storedTheme = 'light'"
          >
            Светлая
          </n-button>

          <n-button
            :type="getButtonType('dark')"
            @click.left.exact.prevent="storedTheme = 'dark'"
          >
            Тёмная
          </n-button>
        </n-flex>
      </n-flex>
    </template>
  </nav-popover>
</template>

<style lang="scss" module>
  .container {
    padding: 12px;
  }

  .text {
    font-weight: 600;
    color: var(--text-color-title);
  }

  .is-active {
    background-color: var(--hover);
  }
</style>
