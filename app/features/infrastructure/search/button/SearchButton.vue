<script setup lang="ts">
  import { useSearchPalette } from '../composables';
  import { SEARCH_ICON, SEARCH_SHORTCUT_KEYS, SEARCH_TEXT } from '../model';
  import { SearchPalette } from '../palette';

  /**
   * Кнопка поиска в боковой панели. Она же держит окно поиска и его горячие
   * клавиши: панель есть на каждой странице.
   */
  const { isOpen, open } = useSearchPalette();

  defineShortcuts(
    Object.fromEntries(SEARCH_SHORTCUT_KEYS.map((key) => [key, open])),
  );
</script>

<template>
  <UButton
    :icon="SEARCH_ICON.search"
    :aria-label="SEARCH_TEXT.open"
    color="neutral"
    variant="ghost"
    size="xl"
    @click.left.exact.prevent="open"
  />

  <SearchPalette v-model:open="isOpen" />
</template>
