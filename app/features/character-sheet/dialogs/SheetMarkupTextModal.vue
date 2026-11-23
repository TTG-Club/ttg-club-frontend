<script setup lang="ts">
  import { PERSONALITY_TEXT } from '../model';
  import SheetMarkupField from './SheetMarkupField.vue';

  /**
   * Правка одного текста в разметке: черты характера, описание, история.
   * Черновик применяется кнопкой «Сохранить».
   */
  const { title, value } = defineProps<{
    title: string;
    value: ReadonlyArray<string>;
  }>();

  const emit = defineEmits<{
    save: [blocks: Array<string>];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const draft = ref<Array<string>>([]);

  watch(isOpen, (open) => {
    if (open) {
      draft.value = [...value];
    }
  });

  function save(): void {
    emit(
      'save',
      draft.value.filter((block) => block.trim()),
    );

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <SheetMarkupField v-model="draft" />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="PERSONALITY_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="PERSONALITY_TEXT.save"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
