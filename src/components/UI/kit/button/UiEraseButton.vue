<template>
  <ui-button
    v-tippy="{ content: 'Стереть строку поиска' }"
    :class="$style['ui-erase-button']"
    :body-class="bodyClasses"
    type="text"
    icon="close"
    color="text"
    @click.prevent="value = ''"
  />
</template>

<script setup lang="ts">
  import { useVModel } from '@vueuse/core';
  import { useCssModule } from 'vue';
  import clsx from 'clsx';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import type { ClassName } from '@/types/Shared/Vue.types';

  const props = defineProps<{
    modelValue: string;
    bodyClass: ClassName;
  }>();

  const $style = useCssModule();

  const bodyClasses = clsx([props.bodyClass, $style.body]);

  const value = useVModel(props, 'modelValue');
</script>

<style lang="scss" module>
  .ui-erase-button {
    .body {
      height: 100%;
      border-radius: 0;
    }
  }
</style>
