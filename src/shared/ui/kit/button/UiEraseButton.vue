<script setup lang="ts">
  import { useVModel } from '@vueuse/core';
  import clsx from 'clsx';
  import { useCssModule } from 'vue';

  import type { ClassName } from '@/shared/types/Vue';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  const props = defineProps<{
    modelValue: string;
    bodyClass: ClassName;
  }>();

  const $style = useCssModule();

  const bodyClasses = clsx([props.bodyClass, $style.body]);

  const value = useVModel(props, 'modelValue');
</script>

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

<style lang="scss" module>
  .ui-erase-button {
    .body {
      height: 100%;
      border-radius: 0;
    }
  }
</style>
