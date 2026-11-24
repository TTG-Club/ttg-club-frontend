<script setup lang="ts">
  import { CATALOG_TREE_TEXT } from '../model';

  /**
   * Своя запись вместо записи справочника: только название (своя раса,
   * предыстория).
   */
  const { title, hint } = defineProps<{
    title: string;
    hint: string;
  }>();

  const emit = defineEmits<{
    save: [name: string];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const name = ref('');

  const canSave = computed(() => Boolean(name.value.trim()));

  function save(): void {
    if (!canSave.value) {
      return;
    }

    emit('save', name.value.trim());
    isOpen.value = false;
  }

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (open) => {
    if (open) {
      name.value = '';
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <UFormField :label="CATALOG_TREE_TEXT.customName">
        <UInput
          v-model="name"
          autofocus
          class="w-full"
          @keydown.enter.exact.prevent="save"
        />
      </UFormField>

      <span class="text-xs text-muted">{{ hint }}</span>
    </template>

    <template #footer>
      <div class="ml-auto flex gap-2">
        <UButton
          :label="CATALOG_TREE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="CATALOG_TREE_TEXT.save"
          color="primary"
          :disabled="!canSave"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
