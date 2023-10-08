<template>
  <dialog-modal
    model-value
    @confirm="onConfirm"
  >
    <template
      v-if="title !== undefined"
      #title
    >
      {{ title }}
    </template>

    <template #content>
      <p class="content">
        {{ text }}
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

    <template #cancelCaption>Отмена</template>

    <template #confirmCaption>Удалить</template>
  </dialog-modal>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import {
    setShouldDeleteWithoutConfirm,
    shouldDeleteWithoutConfirm
  } from '@/features/bookmarks/utils';

  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';
  import DialogModal from '@/shared/ui/modals/DialogModal.vue';

  defineProps<{
    title?: string;
    text: string;
  }>();

  const isNeedToAskConfirmation = ref(shouldDeleteWithoutConfirm());

  const onToggle = (value: boolean) => {
    isNeedToAskConfirmation.value = value;
  };

  const onConfirm = () => {
    setShouldDeleteWithoutConfirm(isNeedToAskConfirmation.value);
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
