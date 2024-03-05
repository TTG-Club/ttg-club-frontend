<script setup lang="ts">
  import clsx from 'clsx';
  import { useCssModule } from 'vue';

  import type { ClassName } from '@/shared/types/Vue';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  const props = defineProps<{
    bodyClass: ClassName;
  }>();

  const $style = useCssModule();

  const bodyClasses = clsx([props.bodyClass, $style.body]);
</script>

<template>
  <ui-button
    v-tippy="{ content: 'Стереть строку поиска' }"
    :class="$style['ui-erase-button']"
    :body-class="bodyClasses"
    type="text"
    icon="close"
    color="text"
    @click="$emit('click', $event)"
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
