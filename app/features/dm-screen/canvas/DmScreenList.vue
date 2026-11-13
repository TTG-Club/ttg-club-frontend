<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    getDmScreenWindowIcon,
    isDmScreenNotePath,
  } from '../model';
  import { DmScreenNote } from '../window';

  /**
   * Ширма на телефоне: окнам негде встать рядом, поэтому добавленные записи
   * идут списком ссылок на их страницы. У заметки страницы нет: она
   * раскрывается прямо в списке, там же её можно править.
   */
  const { windows, close } = useDmScreen();
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="screenWindow in windows"
      :key="screenWindow.id"
      class="flex flex-col rounded-lg border border-default bg-elevated/50"
    >
      <div class="flex items-center gap-2 pr-1">
        <span
          v-if="isDmScreenNotePath(screenWindow.path)"
          class="flex min-w-0 flex-auto items-center gap-3 p-3"
        >
          <UIcon
            :name="DM_SCREEN_ICON.note"
            class="size-5 shrink-0 text-primary"
          />

          <span class="truncate text-highlighted">{{
            screenWindow.title
          }}</span>
        </span>

        <NuxtLink
          v-else
          :to="screenWindow.path"
          class="flex min-w-0 flex-auto items-center gap-3 p-3"
        >
          <UIcon
            :name="getDmScreenWindowIcon(screenWindow.path)"
            class="size-5 shrink-0 text-primary"
          />

          <span class="truncate text-highlighted">{{
            screenWindow.title
          }}</span>
        </NuxtLink>

        <UButton
          :icon="DM_SCREEN_ICON.close"
          :aria-label="`${DM_SCREEN_TEXT.remove}: ${screenWindow.title}`"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close(screenWindow.id)"
        />
      </div>

      <DmScreenNote
        v-if="isDmScreenNotePath(screenWindow.path)"
        :screen-window="screenWindow"
        is-toggle-shown
        class="px-3 pb-3"
      />
    </li>
  </ul>
</template>
