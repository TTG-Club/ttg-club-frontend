<script setup lang="ts">
  import type { WorkshopImageType } from '../model';

  import { WorkshopImages } from '../images';
  import { WorkshopRevisions } from '../revisions';
  import WorkshopEntryState from './WorkshopEntryState.vue';

  /**
   * Правка записи: загрузка, форма из слота, картинки записи и история
   * изменений под ней. Форма и история пересоздаются при смене версии записи.
   */
  const {
    apiSection,
    entryId = undefined,
    version,
    isLoading,
    isNotFound,
    isError,
    hasRevisions = true,
    imageType = undefined,
  } = defineProps<{
    /** Раздел в ручках мастерской: `spells`, `items/magic`. */
    apiSection: string;
    /** Идентификатор загруженной записи; у источника это аббревиатура. */
    entryId?: number | string;
    version: number;
    isLoading: boolean;
    isNotFound: boolean;
    isError: boolean;
    /** У существ и источников истории изменений нет. */
    hasRevisions?: boolean;
    /** Раздел галереи записи; без него блока картинок нет. */
    imageType?: WorkshopImageType;
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

      <WorkshopImages
        v-if="imageType && typeof entryId === 'number'"
        :type="imageType"
        :entry-id="entryId"
      />

      <WorkshopRevisions
        v-if="hasRevisions && typeof entryId === 'number'"
        :key="version"
        :api-section="apiSection"
        :entry-id="entryId"
        @restored="handleReload"
      />
    </div>
  </WorkshopEntryState>
</template>
