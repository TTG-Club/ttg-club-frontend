<script setup lang="ts">
  import type { RevisionInfo } from '../model';

  import {
    REVISION_DATE_FORMAT,
    REVISION_ICON,
    REVISION_OPERATION_COLORS,
    REVISION_OPERATION_LABELS,
    REVISION_TEXT,
  } from '../model';

  /** Строка истории: номер, операция, автор, дата и восстановление. */
  const { revision, isDisabled, isRestoring } = defineProps<{
    revision: RevisionInfo;
    /** Идёт восстановление другой ревизии. */
    isDisabled: boolean;
    isRestoring: boolean;
  }>();

  const emit = defineEmits<{
    restore: [];
  }>();

  const dateLabel = useDateFormat(
    () => revision.createdAt,
    REVISION_DATE_FORMAT,
  );

  const hasDate = computed(
    () => !!revision.createdAt && !Number.isNaN(Date.parse(revision.createdAt)),
  );

  const numberLabel = computed(
    () => `${REVISION_TEXT.numberPrefix}${revision.revision}`,
  );

  const operationLabel = computed(
    () => REVISION_OPERATION_LABELS[revision.operation],
  );

  const operationColor = computed(
    () => REVISION_OPERATION_COLORS[revision.operation],
  );

  function handleRestore(): void {
    emit('restore');
  }
</script>

<template>
  <li
    class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-default bg-elevated/50 px-3 py-2"
  >
    <div class="flex flex-wrap items-center gap-3 text-sm">
      <span class="font-semibold text-highlighted">{{ numberLabel }}</span>

      <UBadge
        :label="operationLabel"
        :color="operationColor"
        variant="subtle"
      />

      <span class="text-highlighted">{{ revision.username }}</span>

      <span
        v-if="hasDate"
        class="text-muted"
      >
        {{ dateLabel }}
      </span>
    </div>

    <UButton
      :label="REVISION_TEXT.restore"
      :icon="REVISION_ICON.restore"
      :loading="isRestoring"
      :disabled="isDisabled"
      color="neutral"
      variant="subtle"
      size="sm"
      @click.left.exact.prevent="handleRestore"
    />
  </li>
</template>
