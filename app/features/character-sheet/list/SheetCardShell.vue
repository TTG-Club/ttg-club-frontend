<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SheetDocument } from '../model';

  import {
    getClassesLabel,
    getSheetStats,
    SHEET_ICON,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
  } from '../model';

  /**
   * Оболочка карточки листа в списке: портрет, имя, классы и раса, хиты и
   * уровень, пометка и меню действий. Ссылка растянута на всю карточку. Без
   * документа (лист недоступен) вместо сводки — переданное описание.
   */
  const {
    name,
    document,
    to = '',
    menuItems,
    menuAria,
    badge = '',
    description = '',
    isDisabled = false,
  } = defineProps<{
    name: string;
    document: SheetDocument | null;
    /** Куда ведёт карточка; без адреса она не кликается. */
    to?: string;
    menuItems: Array<Array<DropdownMenuItem>>;
    menuAria: string;
    /** Короткая пометка рядом с именем. */
    badge?: string;
    /** Строка вместо сводки, когда документа нет. */
    description?: string;
    isDisabled?: boolean;
  }>();

  /** Файл портрета не открылся — вместо него значок. */
  const isAvatarBroken = ref(false);

  const avatarSource = computed(() =>
    isAvatarBroken.value ? undefined : (document?.avatarUrl ?? undefined),
  );

  watch(
    () => document?.avatarUrl,
    () => {
      isAvatarBroken.value = false;
    },
  );

  const openLabel = computed(() => `${SHEET_LIST_TEXT.openAria}: ${name}`);

  // Максимум хитов с прибавками механики и эффектов — тот же, что на листе
  const stats = computed(() => (document ? getSheetStats(document) : null));

  const subtitle = computed(() =>
    document
      ? [
          getClassesLabel(document.classes),
          document.race?.name || SHEET_LIST_TEXT.noRace,
        ].join(' · ')
      : description,
  );

  const statusLabel = computed(() =>
    document && stats.value
      ? `${SHEET_LIST_TEXT.hitPoints}: ${document.health.current} / ${stats.value.hitPointsMax} · ${SHEET_LIST_TEXT.level}: ${stats.value.level}`
      : '',
  );
</script>

<template>
  <div
    class="relative flex min-h-20 w-full items-center gap-3 rounded-xl border border-default bg-elevated p-3 transition-all"
    :class="to ? 'hover:border-accented hover:bg-accented' : 'opacity-80'"
  >
    <!-- Ссылка растянута на всю карточку, чтобы клик ловили и поля, и пустое
      место справа от текста. Кнопки идут после неё и позиционированы —
      они остаются сверху -->
    <NuxtLink
      v-if="to"
      :to="to"
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
          :alt="name"
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
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate text-base font-semibold text-highlighted">
            {{ name }}
          </span>

          <UBadge
            v-if="badge"
            :label="badge"
            color="primary"
            variant="subtle"
            size="sm"
            class="shrink-0"
          />
        </span>

        <span
          class="truncate text-sm"
          :class="document ? 'text-toned' : 'text-muted'"
        >
          {{ subtitle }}
        </span>

        <span
          v-if="statusLabel"
          class="mt-0.5 flex items-center gap-1 text-xs text-muted"
        >
          <UIcon
            :name="SHEET_LIST_ICON.hitPoints"
            class="size-3.5 shrink-0 text-error"
          />

          <span class="truncate">{{ statusLabel }}</span>
        </span>
      </div>
    </div>

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
          :aria-label="menuAria"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
