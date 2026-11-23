<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { CharacterSheet } from '../model';

  import {
    getCharacterLevel,
    getSheetRoute,
    getSheetSummary,
    SHEET_ICON,
    SHEET_TEXT,
  } from '../model';

  /** Карточка листа в списке: имя, раса и классы, уровень; меню действий. */
  const { sheet, isDisabled = false } = defineProps<{
    sheet: CharacterSheet;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    copy: [sheet: CharacterSheet];
    remove: [sheet: CharacterSheet];
  }>();

  const route = computed(() => getSheetRoute(sheet.id));

  const summary = computed(() => getSheetSummary(sheet));

  const levelLabel = computed(
    () => `${getCharacterLevel(sheet.data.classes)} ${SHEET_TEXT.levelShort}`,
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    {
      label: SHEET_TEXT.copy,
      icon: SHEET_ICON.copy,
      onSelect: () => emit('copy', sheet),
    },
    {
      label: SHEET_TEXT.remove,
      icon: SHEET_ICON.remove,
      color: 'error',
      onSelect: () => emit('remove', sheet),
    },
  ]);
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-default bg-elevated/40 p-3 transition-colors hover:border-primary/60"
  >
    <NuxtLink
      :to="route"
      class="flex min-w-0 flex-1 items-center gap-3"
    >
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-elevated text-lg font-semibold text-highlighted"
      >
        {{ levelLabel }}
      </div>

      <div class="flex min-w-0 flex-col">
        <span class="truncate font-semibold text-highlighted">
          {{ sheet.name }}
        </span>

        <span class="truncate text-sm text-muted">{{ summary }}</span>
      </div>
    </NuxtLink>

    <UDropdownMenu
      :items="menuItems"
      :disabled="isDisabled"
    >
      <UButton
        :icon="SHEET_ICON.menu"
        color="neutral"
        variant="ghost"
        :disabled="isDisabled"
      />
    </UDropdownMenu>
  </div>
</template>
