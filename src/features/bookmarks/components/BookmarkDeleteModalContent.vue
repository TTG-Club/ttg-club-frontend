<template>
  <p class="content">
    Вы действительно хотите удалить закладку "{{ props.bookmarkName }}"?
  </p>

  <ui-checkbox
    v-model="isNeedToAskConfirmation"
    class="checkbox"
    type="toggle"
    @update:model-value="onToggle"
  >
    Удалять без подтверждения
  </ui-checkbox>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';

  const props = defineProps<{
    bookmarkName: string;
    isNeedToAskConfirmation: boolean;
  }>();

  const isNeedToAskConfirmation = ref(props.isNeedToAskConfirmation);

  interface IEmits {
    (e: 'toggleConfirmation', value: boolean): void;
  }

  const emit = defineEmits<IEmits>();

  const onToggle = (value: boolean) => {
    emit('toggleConfirmation', value);
  };
</script>

<style lang="scss" scoped>
  .content {
    margin: 0;
  }

  .checkbox {
    margin-top: 16px;
  }
</style>
