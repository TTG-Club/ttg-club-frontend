<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { TrackerListItem } from '../model';

  import { TrackerConfirmModal, TrackerNameModal } from '../dialogs';
  import {
    getTrackerRoute,
    INITIATIVE_ICON,
    INITIATIVE_TEXT,
    TRACKER_DATE_FORMAT,
    TRACKER_DATE_LOCALE,
    TRACKER_STATUS_META,
  } from '../model';

  /** Бой в списке: открыть, переименовать, убрать в историю. */
  const { tracker, isDisabled = false } = defineProps<{
    tracker: TrackerListItem;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    rename: [id: string, name: string];
    remove: [id: string];
  }>();

  const isRenameOpen = ref(false);
  const isRemoveOpen = ref(false);

  const status = computed(() => TRACKER_STATUS_META[tracker.status]);

  const isActive = computed(() => tracker.status === 'ACTIVE');

  const route = computed(() => getTrackerRoute(tracker.id));

  const updatedAt = useDateFormat(
    () => tracker.updatedAt ?? '',
    TRACKER_DATE_FORMAT,
    { locales: TRACKER_DATE_LOCALE },
  );

  const roundLabel = computed(
    () => `${INITIATIVE_TEXT.round} ${tracker.round}`,
  );

  const removeDescription = computed(
    () => `«${tracker.name}». ${INITIATIVE_TEXT.removeSoft}`,
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    {
      label: INITIATIVE_TEXT.rename,
      icon: INITIATIVE_ICON.rename,
      onSelect: openRename,
    },
    {
      label: INITIATIVE_TEXT.remove,
      icon: INITIATIVE_ICON.remove,
      color: 'error',
      onSelect: openRemove,
    },
  ]);

  function openRename(): void {
    isRenameOpen.value = true;
  }

  function openRemove(): void {
    isRemoveOpen.value = true;
  }

  /**
   * Сохраняет новое имя.
   * @param name - новое имя
   */
  function rename(name: string): void {
    emit('rename', tracker.id, name);
  }

  function remove(): void {
    emit('remove', tracker.id);
  }
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-default bg-elevated/50 p-3"
  >
    <UIcon
      :name="status.icon"
      class="size-5 shrink-0 text-muted"
    />

    <div class="flex min-w-0 flex-auto flex-col">
      <ULink
        v-if="!tracker.deleted"
        :to="route"
        class="truncate text-highlighted"
      >
        {{ tracker.name }}
      </ULink>

      <span
        v-else
        class="truncate text-muted"
      >
        {{ tracker.name }}
      </span>

      <span
        v-if="tracker.updatedAt"
        class="text-xs text-muted"
      >
        {{ updatedAt }}
      </span>
    </div>

    <UBadge
      v-if="tracker.deleted"
      :label="INITIATIVE_TEXT.inHistory"
      :icon="INITIATIVE_ICON.remove"
      color="neutral"
      variant="subtle"
    />

    <template v-else>
      <UBadge
        v-if="isActive"
        :label="roundLabel"
        color="neutral"
        variant="subtle"
        class="max-sm:hidden"
      />

      <UBadge
        :label="tracker.statusName"
        :color="status.color"
        variant="subtle"
      />

      <UDropdownMenu :items="menuItems">
        <UButton
          :icon="INITIATIVE_ICON.menu"
          :aria-label="INITIATIVE_TEXT.actions"
          :disabled="isDisabled"
          color="neutral"
          variant="ghost"
        />
      </UDropdownMenu>

      <TrackerNameModal
        v-model:open="isRenameOpen"
        :title="INITIATIVE_TEXT.renameTitle"
        :name="tracker.name"
        :placeholder="INITIATIVE_TEXT.namePlaceholder"
        @save="rename"
      />

      <TrackerConfirmModal
        v-model:open="isRemoveOpen"
        :title="INITIATIVE_TEXT.removeTitle"
        :description="removeDescription"
        :confirm-label="INITIATIVE_TEXT.remove"
        :confirm-icon="INITIATIVE_ICON.remove"
        @confirm="remove"
      />
    </template>
  </div>
</template>
