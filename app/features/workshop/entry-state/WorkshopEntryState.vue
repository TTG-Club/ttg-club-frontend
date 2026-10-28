<script setup lang="ts">
  import { WORKSHOP_ICON, WORKSHOP_TEXT } from '../model';

  /** Загрузка записи для правки: скелет, ошибка или сама форма. */
  const { isLoading, isNotFound, isError } = defineProps<{
    isLoading: boolean;
    isNotFound: boolean;
    isError: boolean;
  }>();

  const emit = defineEmits<{
    retry: [];
  }>();

  function handleRetry(): void {
    emit('retry');
  }
</script>

<template>
  <div
    v-if="isLoading"
    class="grid grid-cols-1 gap-4 md:grid-cols-2"
  >
    <USkeleton class="h-14 w-full" />

    <USkeleton class="h-14 w-full" />

    <USkeleton class="h-14 w-full" />

    <USkeleton class="h-14 w-full" />

    <USkeleton class="h-64 w-full md:col-span-2" />
  </div>

  <UEmpty
    v-else-if="isNotFound"
    :icon="WORKSHOP_ICON.error"
    :title="WORKSHOP_TEXT.notFound"
    variant="naked"
  />

  <UEmpty
    v-else-if="isError"
    :icon="WORKSHOP_ICON.error"
    :title="WORKSHOP_TEXT.loadError"
    variant="naked"
  >
    <template #actions>
      <UButton
        :label="WORKSHOP_TEXT.retry"
        @click.left.exact.prevent="handleRetry"
      />
    </template>
  </UEmpty>

  <slot v-else />
</template>
