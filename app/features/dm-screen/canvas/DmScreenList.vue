<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    resolveDmScreenSection,
  } from '../model';

  /**
   * Ширма на телефоне: окнам негде встать рядом, поэтому добавленные записи
   * идут списком ссылок на их страницы.
   */
  const { windows, close } = useDmScreen();

  /**
   * Иконка раздела записи.
   * @param path - адрес записи
   */
  function getIcon(path: string): string {
    return resolveDmScreenSection(path)?.icon ?? DM_SCREEN_ICON.unknown;
  }
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="screenWindow in windows"
      :key="screenWindow.id"
      class="flex items-center gap-2 rounded-lg border border-default bg-elevated/50 pr-1"
    >
      <NuxtLink
        :to="screenWindow.path"
        class="flex min-w-0 flex-auto items-center gap-3 p-3"
      >
        <UIcon
          :name="getIcon(screenWindow.path)"
          class="size-5 shrink-0 text-primary"
        />

        <span class="truncate text-highlighted">{{ screenWindow.title }}</span>
      </NuxtLink>

      <UButton
        :icon="DM_SCREEN_ICON.close"
        :aria-label="`${DM_SCREEN_TEXT.remove}: ${screenWindow.title}`"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close(screenWindow.id)"
      />
    </li>
  </ul>
</template>
