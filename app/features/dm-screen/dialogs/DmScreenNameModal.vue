<script setup lang="ts">
  import { DM_SCREEN_NAME_MAX_LENGTH, DM_SCREEN_TEXT } from '../model';

  /** Имя ширмы: при создании и при переименовании. */
  const { title, name = '' } = defineProps<{
    title: string;
    /** Имя сейчас: с него начинается правка. */
    name?: string;
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

    // Сначала событие: закрытие окна сбрасывает у родителя выбранную ширму
    emit('save', trimmed.value);
    isOpen.value = false;
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
          :placeholder="DM_SCREEN_TEXT.namePlaceholder"
          :maxlength="DM_SCREEN_NAME_MAX_LENGTH"
          autofocus
          class="w-full"
        />

        <div class="flex justify-end gap-2">
          <UButton
            :label="DM_SCREEN_TEXT.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="close"
          />

          <UButton
            type="submit"
            :label="DM_SCREEN_TEXT.save"
            :disabled="isUnchanged"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
