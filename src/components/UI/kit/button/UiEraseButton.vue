<template>
  <ui-button
    v-tippy="{ content: 'Стереть строку поиска' }"
    class="ui-erase-button"
    type-link
    is-icon
    @click.prevent="value = ''"
  >
    <svg-icon
      icon="close"
      :size="16"
    />
  </ui-button>
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
