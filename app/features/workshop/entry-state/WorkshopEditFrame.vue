<script setup lang="ts">
  import { WorkshopRevisions } from '../revisions';
  import WorkshopEntryState from './WorkshopEntryState.vue';

  /**
   * Правка записи: загрузка, форма из слота и история изменений под ней.
   * Форма и история пересоздаются при смене версии записи.
   */
  const {
    apiSection,
    entryId = undefined,
    version,
    isLoading,
    isNotFound,
    isError,
    hasRevisions = true,
  } = defineProps<{
    /** Раздел в ручках мастерской: `spells`, `items/magic`. */
    apiSection: string;
    /** Идентификатор загруженной записи. */
    entryId?: number;
    version: number;
    isLoading: boolean;
    isNotFound: boolean;
    isError: boolean;
    /** У существ истории изменений нет. */
    hasRevisions?: boolean;
  }>();

  const emit = defineEmits<{
    reload: [];
  }>();

  function handleReload(): void {
    emit('reload');
  }
</script>

<template>
  <WorkshopEntryState
    :is-loading="isLoading"
    :is-not-found="isNotFound"
    :is-error="isError"
    @retry="handleReload"
  >
    <div
      v-if="entryId !== undefined"
      class="flex max-w-5xl flex-col gap-8"
    >
      <slot />

      <WorkshopRevisions
        v-if="hasRevisions"
        :key="version"
        :api-section="apiSection"
        :entry-id="entryId"
        @restored="handleReload"
      />
    </div>
  </WorkshopEntryState>
</template>
