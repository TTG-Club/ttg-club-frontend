<script setup lang="ts">
  import type { SearchResult } from '~infrastructure/search/model';

  import { useSiteSearch } from '~infrastructure/search/composables';
  import { SEARCH_DEBOUNCE_MS } from '~infrastructure/search/model';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_SEARCH_SIZE,
    DM_SCREEN_TEXT,
    isDmScreenPath,
  } from '../model';

  /**
   * Поиск по всему сайту прямо на ширме: найденная запись встаёт окном, не
   * уходя со страницы. Показываются только записи разделов, которые ширма
   * умеет показывать.
   */
  const { add, isAdded } = useDmScreen();

  const input = ref('');

  const term = refDebounced(input, SEARCH_DEBOUNCE_MS);

  const { data, status } = useSiteSearch({
    key: 'dm-screen-search',
    term,
    size: DM_SCREEN_SEARCH_SIZE,
    server: false,
  });

  const results = computed(() =>
    data.value.items.filter((result) => isDmScreenPath(result.url)),
  );

  const isOpen = computed(() => !!term.value.trim());

  const isEmpty = computed(
    () => status.value === 'success' && !results.value.length,
  );

  /**
   * Добавляет найденную запись окном рядом с местом клика.
   * @param result - найденная запись
   * @param event - клик по записи
   */
  function addResult(result: SearchResult, event: MouseEvent): void {
    add({
      path: result.url,
      title: result.name,
      origin: { x: event.clientX, y: event.clientY },
    });

    input.value = '';
  }
</script>

<template>
  <!-- На телефоне поиск занимает строку целиком, на широком экране стоит
  слева от кнопок шапки -->
  <div class="relative w-full md:w-72">
    <UInput
      v-model="input"
      :icon="DM_SCREEN_ICON.search"
      :placeholder="DM_SCREEN_TEXT.searchPlaceholder"
      :loading="status === 'pending'"
      class="w-full"
    />

    <div
      v-if="isOpen"
      class="absolute inset-x-0 top-full z-10 mt-1 flex max-h-[60dvh] flex-col overflow-y-auto rounded-md border border-default bg-default p-1 shadow-lg"
    >
      <p
        v-if="isEmpty"
        class="px-3 py-2 text-sm text-muted"
      >
        {{ DM_SCREEN_TEXT.searchEmpty }}
      </p>

      <button
        v-for="result in results"
        :key="result.url"
        type="button"
        class="flex items-center gap-2 rounded px-3 py-2 text-left transition-colors hover:bg-elevated"
        @click.left.exact.prevent="addResult(result, $event)"
      >
        <span class="min-w-0 flex-auto">
          <span class="block truncate text-highlighted">
            {{ result.name }}

            <span
              v-if="result.englishName"
              class="text-muted"
              >[{{ result.englishName }}]</span
            >
          </span>

          <span class="block truncate text-sm text-muted">
            {{ result.section }}
          </span>
        </span>

        <UIcon
          :name="DM_SCREEN_ICON.add"
          :class="isAdded(result.url) ? 'text-primary' : 'text-muted'"
          class="size-5 shrink-0"
        />
      </button>
    </div>
  </div>
</template>
