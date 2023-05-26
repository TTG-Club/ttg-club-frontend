<template>
  <ui-button
    v-tippy="{ content: 'Стереть строку поиска' }"
    :class="$style['ui-erase-button']"
    type="text"
    icon="close"
    color="text"
    @click.prevent="value = ''"
  />
</template>

<script setup lang="ts">
  import { useVModel } from '@vueuse/core';
  import SvgIcon from "@/components/UI/icons/SvgIcon.vue";
  import UiButton from '@/components/UI/kit/button/UiButton.vue';

  const props = defineProps<{
    modelValue: string;
  }>();

  const value = useVModel(props, 'modelValue');
</script>

<style lang="scss" module>
  .ui-erase-button {
    button {
      height: 100%;
      border-radius: 0;
    }
  }
</style>
