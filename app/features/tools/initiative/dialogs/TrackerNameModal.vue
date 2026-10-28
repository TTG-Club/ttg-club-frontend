<script setup lang="ts">
  import { INITIATIVE_LIMIT, INITIATIVE_TEXT } from '../model';

  /** Переименование трекера или участника. */
  const { title, name, placeholder } = defineProps<{
    title: string;
    /** Имя сейчас: с него начинается правка. */
    name: string;
    placeholder: string;
  }>();

  const emit = defineEmits<{
    save: [name: string];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const draft = ref(name);

  const trimmed = computed(() => draft.value.trim());

  const isUnchanged = computed(() => !trimmed.value || trimmed.value === name);

  // Каждое открытие начинается с текущего имени, а не с прошлой правки
  watch(isOpen, (open) => {
    if (open) {
      draft.value = name;
    }
  });

  function close(): void {
    isOpen.value = false;
  }

  function save(): void {
    if (isUnchanged.value) {
      return;
    }

    isOpen.value = false;
    emit('save', trimmed.value);
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-sm' }"
  >
    <template #body>
      <form
        class="flex flex-col gap-4"
        @submit.prevent="save"
      >
        <UInput
          v-model="draft"
          :placeholder="placeholder"
          :maxlength="INITIATIVE_LIMIT.name"
          autofocus
          class="w-full"
        />

        <div class="flex justify-end gap-2">
          <UButton
            :label="INITIATIVE_TEXT.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="close"
          />

          <UButton
            type="submit"
            :label="INITIATIVE_TEXT.save"
            :disabled="isUnchanged"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
