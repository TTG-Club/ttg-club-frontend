<script setup lang="ts">
  import type { RevisionInfo } from '../model';

  import { getApiErrorMessage } from '~user/model';

  import {
    fetchRevisions,
    restoreRevision,
    REVISION_ICON,
    REVISION_TEXT,
    WORKSHOP_ICON,
  } from '../model';
  import WorkshopRevisionItem from './WorkshopRevisionItem.vue';

  /** История изменений записи с восстановлением из ревизии. */
  const { apiSection, entryId } = defineProps<{
    /** Раздел в ручках мастерской: `spells`, `items/magic`. */
    apiSection: string;
    entryId: number;
  }>();

  const emit = defineEmits<{
    restored: [];
  }>();

  const toast = useToast();

  const revisions = ref<Array<RevisionInfo>>([]);
  const isLoading = ref(true);
  const isError = ref(false);
  const restoringRevision = ref<number>();
  const confirmRevision = ref<number>();

  const isConfirmOpen = computed({
    get: () => confirmRevision.value !== undefined,
    set: (value) => {
      if (!value) {
        confirmRevision.value = undefined;
      }
    },
  });

  const confirmDescription = computed(
    () => `${REVISION_TEXT.restoreDescription}${confirmRevision.value ?? ''}?`,
  );

  const isRestoring = computed(() => restoringRevision.value !== undefined);

  async function load(): Promise<void> {
    isLoading.value = true;
    isError.value = false;

    try {
      revisions.value = await fetchRevisions(apiSection, entryId);
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function askRestore(revision: number): void {
    confirmRevision.value = revision;
  }

  function closeConfirm(): void {
    confirmRevision.value = undefined;
  }

  async function confirmRestore(): Promise<void> {
    const revision = confirmRevision.value;

    if (revision === undefined) {
      return;
    }

    confirmRevision.value = undefined;
    restoringRevision.value = revision;

    try {
      await restoreRevision(apiSection, entryId, revision);

      toast.add({
        title: REVISION_TEXT.restored,
        color: 'success',
        icon: WORKSHOP_ICON.success,
      });

      emit('restored');
      await load();
    } catch (error) {
      toast.add({
        title: REVISION_TEXT.restoreError,
        description: getApiErrorMessage(error, '') || undefined,
        color: 'error',
        icon: WORKSHOP_ICON.error,
      });
    } finally {
      restoringRevision.value = undefined;
    }
  }

  async function handleRetry(): Promise<void> {
    await load();
  }

  onMounted(load);
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="flex items-center gap-2 font-semibold text-highlighted">
      <UIcon
        :name="REVISION_ICON.title"
        class="size-5 text-primary"
      />

      {{ REVISION_TEXT.title }}
    </h2>

    <div
      v-if="isLoading"
      class="flex flex-col gap-2"
    >
      <USkeleton class="h-12 w-full" />

      <USkeleton class="h-12 w-full" />
    </div>

    <UAlert
      v-else-if="isError"
      :title="REVISION_TEXT.loadError"
      :icon="WORKSHOP_ICON.error"
      color="error"
      variant="subtle"
      :actions="[{ label: REVISION_TEXT.retry, onClick: handleRetry }]"
    />

    <p
      v-else-if="!revisions.length"
      class="text-sm text-muted"
    >
      {{ REVISION_TEXT.empty }}
    </p>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <WorkshopRevisionItem
        v-for="revision in revisions"
        :key="revision.revision"
        :revision="revision"
        :is-disabled="isRestoring"
        :is-restoring="restoringRevision === revision.revision"
        @restore="askRestore(revision.revision)"
      />
    </ul>

    <UModal
      v-model:open="isConfirmOpen"
      :title="REVISION_TEXT.restoreTitle"
      :description="confirmDescription"
      :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          :label="REVISION_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="closeConfirm"
        />

        <UButton
          :label="REVISION_TEXT.restoreConfirm"
          :icon="REVISION_ICON.restore"
          color="warning"
          @click.left.exact.prevent="confirmRestore"
        />
      </template>
    </UModal>
  </section>
</template>
