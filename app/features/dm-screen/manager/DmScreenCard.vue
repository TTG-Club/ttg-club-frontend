<script setup lang="ts">
  import type { DmScreenSummary } from '../model';

  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    formatDmScreenDate,
    getDmScreenPagePath,
  } from '../model';

  /** Ширма в списке: имя, число записей, дата изменения и действия. */
  const { screen, isBusy = false } = defineProps<{
    screen: DmScreenSummary;
    /** Идёт изменение списка: кнопки ждут. */
    isBusy?: boolean;
  }>();

  const emit = defineEmits<{
    rename: [screen: DmScreenSummary];
    delete: [screen: DmScreenSummary];
  }>();

  const to = computed(() => getDmScreenPagePath(screen.id));

  const caption = computed(() => {
    const updated = formatDmScreenDate(screen.updatedAt);
    const entries = `${screen.windowCount} ${DM_SCREEN_TEXT.entries}`;

    return updated
      ? `${entries} · ${DM_SCREEN_TEXT.updated} ${updated}`
      : entries;
  });

  function rename(): void {
    emit('rename', screen);
  }

  function remove(): void {
    emit('delete', screen);
  }
</script>

<template>
  <li
    class="flex items-center gap-2 rounded-lg border border-default bg-elevated/50 pr-2 transition-colors hover:bg-elevated"
  >
    <NuxtLink
      :to="to"
      class="flex min-w-0 flex-auto items-center gap-3 p-4"
    >
      <UIcon
        :name="DM_SCREEN_ICON.screen"
        class="size-6 shrink-0 text-primary"
      />

      <span class="min-w-0">
        <span class="block truncate font-medium text-highlighted">
          {{ screen.name }}
        </span>

        <span class="block truncate text-sm text-muted">{{ caption }}</span>
      </span>
    </NuxtLink>

    <UTooltip :text="DM_SCREEN_TEXT.rename">
      <UButton
        :icon="DM_SCREEN_ICON.rename"
        :aria-label="`${DM_SCREEN_TEXT.rename}: ${screen.name}`"
        :disabled="isBusy"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="rename"
      />
    </UTooltip>

    <UTooltip :text="DM_SCREEN_TEXT.delete">
      <UButton
        :icon="DM_SCREEN_ICON.delete"
        :aria-label="`${DM_SCREEN_TEXT.delete}: ${screen.name}`"
        :disabled="isBusy"
        color="error"
        variant="ghost"
        @click.left.exact.prevent="remove"
      />
    </UTooltip>
  </li>
</template>
