<template>
  <p class="content">
    Вы действительно хотите удалить закладку "{{ props.bookmarkName }}"?
  </p>

  <ui-checkbox
    class="checkbox"
    type="toggle"
  >
    Удалять без подтверждения
  </ui-checkbox>
</template>

<script setup lang="ts">
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';

  const props = defineProps<{ bookmarkName: string }>();
</script>

<style lang="scss" scoped>
  .content {
    margin: 0;
  }

  .checkbox {
    margin-top: 16px;
  }
</style>
