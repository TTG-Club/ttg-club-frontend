<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { CharacterSheet } from '../model';

  import {
    downloadSheetJson,
    getClassesLabel,
    getSheetRoute,
    getSheetStats,
    SHEET_ICON,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
    SHEET_TEXT,
  } from '../model';

  /**
   * Карточка листа в списке: аватар, имя, классы и раса, хиты и уровень;
   * меню действий. Ссылка на лист растянута на всю карточку.
   */
  const {
    sheet,
    isDisabled = false,
    canCopy = true,
  } = defineProps<{
    sheet: CharacterSheet;
    isDisabled?: boolean;

    /** В лимите есть место — копия разрешена. */
    canCopy?: boolean;
  }>();

  const emit = defineEmits<{
    copy: [sheet: CharacterSheet];
    remove: [sheet: CharacterSheet];
  }>();

  const route = computed(() => getSheetRoute(sheet.id));

  /** Файл портрета не открылся — вместо него значок. */
  const isAvatarBroken = ref(false);

  const avatarSource = computed(() =>
    isAvatarBroken.value ? undefined : (sheet.data.avatarUrl ?? undefined),
  );

  watch(
    () => sheet.data.avatarUrl,
    () => {
      isAvatarBroken.value = false;
    },
  );

  const openLabel = computed(
    () => `${SHEET_LIST_TEXT.openAria}: ${sheet.name}`,
  );

  // Максимум хитов с прибавками механики и эффектов — тот же, что на листе.
  const stats = computed(() => getSheetStats(sheet.data));

  const subtitle = computed(() =>
    [
      getClassesLabel(sheet.data.classes),
      sheet.data.race?.name || SHEET_LIST_TEXT.noRace,
    ].join(' · '),
  );

  const statusLabel = computed(
    () =>
      `${SHEET_LIST_TEXT.hitPoints}: ${sheet.data.health.current} / ${stats.value.hitPointsMax} · ${SHEET_LIST_TEXT.level}: ${stats.value.level}`,
  );

  /** Скачивает лист JSON-файлом — из документа карточки, без запросов. */
  function downloadJson(): void {
    downloadSheetJson(sheet);
  }

  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      {
        label: SHEET_TEXT.copy,
        icon: SHEET_ICON.copy,
        disabled: !canCopy,
        onSelect: () => emit('copy', sheet),
      },
      {
        label: SHEET_LIST_TEXT.download,
        icon: SHEET_LIST_ICON.download,
        onSelect: downloadJson,
      },
    ],
    [
      {
        label: SHEET_TEXT.remove,
        icon: SHEET_ICON.remove,
        color: 'error',
        onSelect: () => emit('remove', sheet),
      },
    ],
  ]);
</script>

<template>
  <div
    class="relative flex min-h-20 w-full items-center gap-3 rounded-xl border border-default bg-elevated p-3 transition-all hover:border-accented hover:bg-accented"
  >
    <!-- Ссылка растянута на всю карточку, чтобы клик ловили и поля, и пустое
      место справа от текста. Кнопки идут после неё и позиционированы —
      они остаются сверху -->
    <NuxtLink
      :to="route"
      class="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :aria-label="openLabel"
    />

    <div class="flex min-w-0 flex-auto items-center gap-4">
      <div
        class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/5 ring-1 ring-primary/15"
      >
        <img
          v-if="avatarSource"
          :src="avatarSource"
          :alt="sheet.name"
          class="size-full object-cover"
          @error="isAvatarBroken = true"
        />

        <UIcon
          v-else
          :name="SHEET_LIST_ICON.avatar"
          class="size-7 text-primary"
        />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-0.5">
        <span class="truncate text-base font-semibold text-highlighted">
          {{ sheet.name }}
        </span>

        <span class="truncate text-sm text-toned">{{ subtitle }}</span>

        <span class="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <UIcon
            :name="SHEET_LIST_ICON.hitPoints"
            class="size-3.5 shrink-0 text-error"
          />

          <span class="truncate">{{ statusLabel }}</span>
        </span>
      </div>
    </div>

    <!-- Кнопки столбиком: карточка низкая и широкая -->
    <div class="relative flex shrink-0 flex-col gap-1">
      <UDropdownMenu
        :items="menuItems"
        :disabled="isDisabled"
      >
        <UButton
          :icon="SHEET_ICON.menu"
          color="neutral"
          variant="soft"
          square
          :disabled="isDisabled"
          :aria-label="SHEET_LIST_TEXT.menuAria"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
