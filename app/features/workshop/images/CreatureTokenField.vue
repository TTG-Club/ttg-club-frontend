<script setup lang="ts">
  import { useCreatureToken } from '../composables';
  import {
    WORKSHOP_ICON,
    WORKSHOP_IMAGE_ICON,
    WORKSHOP_IMAGE_TEXT,
    WORKSHOP_TOKEN_TEXT,
  } from '../model';

  /**
   * Круглый токен существа: первая картинка в карточке существа, перед
   * галереей. Загрузка и удаление сохраняются сразу.
   */
  const { creatureId } = defineProps<{
    creatureId: number;
  }>();

  const { token, isLoading, isError, isBusy, load, pickFile, remove } =
    useCreatureToken(() => creatureId);

  /** Файла по адресу может не оказаться: тогда показываем заглушку. */
  const isBroken = ref(false);
  const isConfirmOpen = ref(false);

  const isTokenVisible = computed(() => !!token.value && !isBroken.value);

  watch(token, () => {
    isBroken.value = false;
  });

  function handleError(): void {
    isBroken.value = true;
  }

  function askRemove(): void {
    isConfirmOpen.value = true;
  }

  function closeConfirm(): void {
    isConfirmOpen.value = false;
  }

  async function confirmRemove(): Promise<void> {
    isConfirmOpen.value = false;
    await remove();
  }

  async function handleRetry(): Promise<void> {
    await load();
  }

  onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ WORKSHOP_TOKEN_TEXT.title }}
    </h3>

    <p class="text-sm text-muted">
      {{ WORKSHOP_TOKEN_TEXT.description }}
    </p>

    <USkeleton
      v-if="isLoading"
      class="size-40 rounded-full"
    />

    <UAlert
      v-else-if="isError"
      :title="WORKSHOP_TOKEN_TEXT.loadError"
      :icon="WORKSHOP_ICON.error"
      color="error"
      variant="subtle"
      :actions="[{ label: WORKSHOP_IMAGE_TEXT.retry, onClick: handleRetry }]"
    />

    <div
      v-else
      class="flex flex-wrap items-end gap-3"
    >
      <div
        class="flex size-40 items-center justify-center overflow-hidden rounded-full border border-default bg-muted"
      >
        <img
          v-if="isTokenVisible"
          :src="token"
          :alt="WORKSHOP_TOKEN_TEXT.alt"
          class="size-full object-cover"
          @error="handleError"
        />

        <span
          v-else
          class="flex flex-col items-center gap-2 p-4 text-center text-sm text-muted"
        >
          <UIcon
            :name="WORKSHOP_IMAGE_ICON.empty"
            class="size-6"
          />

          {{ WORKSHOP_TOKEN_TEXT.missing }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :label="WORKSHOP_TOKEN_TEXT.upload"
          :icon="WORKSHOP_IMAGE_ICON.upload"
          :loading="isBusy"
          :disabled="isBusy"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="pickFile"
        />

        <UButton
          v-if="token"
          :label="WORKSHOP_TOKEN_TEXT.remove"
          :icon="WORKSHOP_IMAGE_ICON.remove"
          :disabled="isBusy"
          color="error"
          variant="ghost"
          @click.left.exact.prevent="askRemove"
        />
      </div>
    </div>

    <UModal
      v-model:open="isConfirmOpen"
      :title="WORKSHOP_TOKEN_TEXT.removeTitle"
      :description="WORKSHOP_TOKEN_TEXT.removeDescription"
      :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          :label="WORKSHOP_IMAGE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="closeConfirm"
        />

        <UButton
          :label="WORKSHOP_TOKEN_TEXT.remove"
          :icon="WORKSHOP_IMAGE_ICON.remove"
          color="error"
          @click.left.exact.prevent="confirmRemove"
        />
      </template>
    </UModal>
  </div>
</template>
