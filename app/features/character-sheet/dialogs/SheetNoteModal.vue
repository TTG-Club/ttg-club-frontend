<script setup lang="ts">
  import type { SheetNote } from '../model';

  import { NOTE_TEXT } from '../model';
  import SheetMarkupField from './SheetMarkupField.vue';

  /**
   * Заметка, как на new.ttg.club: название и текст в разметке. Пустую
   * заметку (ни названия, ни текста) сохранить нельзя.
   */
  const { note } = defineProps<{
    /** Заметка для правки; без названия и текста — новая. */
    note: SheetNote | null;
  }>();

  const emit = defineEmits<{
    save: [note: SheetNote];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const title = ref('');
  const text = ref<Array<string>>([]);

  watch(isOpen, (open) => {
    if (open) {
      title.value = note?.title ?? '';
      text.value = [...(note?.text ?? [])];
    }
  });

  const isNew = computed(() => !note?.title && !note?.text.length);

  const modalTitle = computed(() =>
    isNew.value ? NOTE_TEXT.createTitle : NOTE_TEXT.editTitle,
  );

  const isEmpty = computed(
    () => !title.value.trim() && !text.value.some((block) => block.trim()),
  );

  function save(): void {
    if (!note || isEmpty.value) {
      return;
    }

    emit('save', {
      ...note,
      title: title.value.trim(),
      text: text.value.filter((block) => block.trim()),
    });

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UFormField :label="NOTE_TEXT.title">
          <UInput
            v-model="title"
            :placeholder="NOTE_TEXT.titlePlaceholder"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField :label="NOTE_TEXT.text">
          <SheetMarkupField
            v-model="text"
            :placeholder="NOTE_TEXT.textPlaceholder"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="NOTE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="isNew ? NOTE_TEXT.add : NOTE_TEXT.save"
          :disabled="isEmpty"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
