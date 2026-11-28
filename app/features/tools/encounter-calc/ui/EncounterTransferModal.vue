<script setup lang="ts">
  import type { EncounterCreature } from '../model';

  import { INITIATIVE_LIMIT, INITIATIVE_TEXT } from '~tools/initiative/model';

  import { useEncounterTransfer } from '../composables';
  import { TRANSFER_LABELS, TRANSFER_NEW_TRACKER } from '../model';

  /**
   * Выбор трекера инициативы, куда переносятся существа калькулятора: новый
   * или один из уже собранных.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { creatures } = defineProps<{
    creatures: Array<EncounterCreature>;
  }>();

  const {
    trackers,
    canCreate,
    createLimitHint,
    transferCount,
    skippedCount,
    isLoading,
    isTransferring,
    loadError,
    loadTrackers,
    transfer,
  } = useEncounterTransfer(computed(() => creatures));

  const selected = ref<string>(TRANSFER_NEW_TRACKER);
  const trackerName = ref('');

  const items = computed(() => [
    {
      value: TRANSFER_NEW_TRACKER,
      label: TRANSFER_LABELS.newTracker,
      description: canCreate.value
        ? TRANSFER_LABELS.newTrackerDescription
        : createLimitHint.value,
      disabled: !canCreate.value,
    },
    ...trackers.value.map((tracker) => ({
      value: tracker.id,
      label: tracker.name,
      description: tracker.isActive
        ? TRANSFER_LABELS.activeTracker
        : TRANSFER_LABELS.preparingTracker,
    })),
  ]);

  const isNewSelected = computed(() => selected.value === TRANSFER_NEW_TRACKER);

  const canSubmit = computed(
    () =>
      !isLoading.value
      && !loadError.value
      && transferCount.value > 0
      && (!isNewSelected.value || canCreate.value),
  );

  const submitLabel = computed(
    () => `${TRANSFER_LABELS.submit} (${transferCount.value})`,
  );

  const skippedTitle = computed(
    () => `${TRANSFER_LABELS.customSkippedTitle} (${skippedCount.value})`,
  );

  // При открытии — свежий список трекеров: их могли собрать или удалить в
  // соседней вкладке. Новый трекер выбран, если его можно создать, иначе —
  // первый из существующих.
  watch(isOpen, async (opened) => {
    if (!opened) {
      return;
    }

    trackerName.value = '';
    await loadTrackers();

    selected.value = canCreate.value
      ? TRANSFER_NEW_TRACKER
      : (trackers.value[0]?.id ?? TRANSFER_NEW_TRACKER);
  });

  /** Закрывает окно без переноса. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Переносит существ в выбранный трекер. */
  async function submit(): Promise<void> {
    const isDone = await transfer(
      isNewSelected.value ? undefined : selected.value,
      trackerName.value,
    );

    if (isDone) {
      isOpen.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="TRANSFER_LABELS.title"
    :description="TRANSFER_LABELS.description"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UAlert
          v-if="skippedCount > 0"
          color="warning"
          variant="subtle"
          icon="tabler:alert-triangle"
          :title="skippedTitle"
          :description="TRANSFER_LABELS.customSkippedDescription"
        />

        <USkeleton
          v-if="isLoading"
          class="h-24"
        />

        <p
          v-else-if="loadError"
          class="text-sm text-error"
        >
          {{ loadError }}
        </p>

        <template v-else>
          <URadioGroup
            v-model="selected"
            :items
            variant="card"
          />

          <UFormField
            v-if="isNewSelected && canCreate"
            :label="TRANSFER_LABELS.name"
          >
            <UInput
              v-model="trackerName"
              :placeholder="INITIATIVE_TEXT.defaultName"
              :maxlength="INITIATIVE_LIMIT.name"
              class="w-full"
            />
          </UFormField>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          :label="TRANSFER_LABELS.cancel"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          icon="tabler:swords"
          :label="submitLabel"
          :loading="isTransferring"
          :disabled="!canSubmit"
          @click.left.exact.prevent="submit"
        />
      </div>
    </template>
  </UModal>
</template>
