<script setup lang="ts">
  import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';

  import type { SearchResult } from '../model';

  import { useSiteSearch } from '../composables';
  import {
    buildSearchRequest,
    SEARCH_DEBOUNCE_MS,
    SEARCH_ICON,
    SEARCH_PAGE_PATH,
    SEARCH_PALETTE_SIZE,
    SEARCH_QUERY_KEY,
    SEARCH_RANDOM_API_URL,
    SEARCH_TEXT,
    searchResponseSchema,
  } from '../model';

  interface SearchPaletteItem extends CommandPaletteItem {
    result?: SearchResult;
  }

  /**
   * Окно быстрого поиска, как в старом SPA: первые результаты, случайные
   * записи по кубику и переход на страницу со всеми результатами.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const term = ref('');
  const query = refDebounced(term, SEARCH_DEBOUNCE_MS);
  const trimmed = computed(() => term.value.trim());

  const {
    data,
    status,
    error: searchError,
  } = useSiteSearch({
    key: 'search-palette',
    term: query,
    size: SEARCH_PALETTE_SIZE,
    server: false,
  });

  const randomResults = shallowRef<Array<SearchResult>>([]);
  const isRandomLoading = ref(false);
  const isRandomError = ref(false);

  /** Пока строка поиска пуста, в окне остаются случайные записи. */
  const results = computed(() =>
    trimmed.value ? data.value.items : randomResults.value,
  );

  const isLoading = computed(
    () =>
      isRandomLoading.value
      || (!!trimmed.value
        && (status.value === 'pending'
          || trimmed.value !== query.value.trim())),
  );

  const isError = computed(() =>
    trimmed.value ? !!searchError.value : isRandomError.value,
  );

  const groups = computed<Array<CommandPaletteGroup<SearchPaletteItem>>>(() => [
    {
      id: 'results',
      ignoreFilter: true,
      items: results.value.map((result) => ({
        label: result.name,
        suffix: result.englishName ? `[${result.englishName}]` : undefined,
        description: result.section,
        to: result.url,
        result,
      })),
    },
  ]);

  const emptyText = computed(() => {
    if (isLoading.value) {
      return SEARCH_TEXT.loading;
    }

    if (isError.value) {
      return SEARCH_TEXT.error;
    }

    return trimmed.value ? SEARCH_TEXT.empty : SEARCH_TEXT.start;
  });

  const total = computed(() => (trimmed.value ? data.value.total : 0));

  const allResultsLink = computed(() => ({
    path: SEARCH_PAGE_PATH,
    query: { [SEARCH_QUERY_KEY]: trimmed.value },
  }));

  /** Подменяет результаты случайными записями и очищает строку поиска. */
  async function showRandom(): Promise<void> {
    term.value = '';
    isRandomLoading.value = true;
    isRandomError.value = false;

    try {
      const response = await $fetch(SEARCH_RANDOM_API_URL, {
        method: 'POST',
        body: buildSearchRequest('', 1, SEARCH_PALETTE_SIZE),
      });

      randomResults.value = searchResponseSchema.parse(response).items;
    } catch {
      randomResults.value = [];
      isRandomError.value = true;
    } finally {
      isRandomLoading.value = false;
    }
  }

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (value) => {
    if (value) {
      return;
    }

    term.value = '';
    randomResults.value = [];
    isRandomError.value = false;
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SEARCH_TEXT.title"
    :ui="{ content: 'top-4 translate-y-0 sm:top-14' }"
  >
    <template #content>
      <UCommandPalette
        v-model:search-term="term"
        :groups="groups"
        :loading="isLoading"
        :icon="SEARCH_ICON.search"
        :placeholder="SEARCH_TEXT.placeholder"
        :ui="{ footer: 'p-2' }"
        @update:model-value="close"
      >
        <template #item-trailing="{ item }">
          <UTooltip
            v-if="item.result?.source"
            :text="item.result.source.name"
          >
            <span class="text-xs text-muted">
              {{ item.result.source.shortName }}
            </span>
          </UTooltip>
        </template>

        <template #empty>
          <p class="py-6 text-center text-sm text-muted">
            {{ emptyText }}
          </p>
        </template>

        <template #footer>
          <div class="flex items-center justify-between gap-2">
            <span class="px-1 text-xs text-muted">
              <template v-if="total"
                >{{ SEARCH_TEXT.found }} {{ total }}</template
              >
            </span>

            <div class="flex items-center gap-1">
              <UButton
                :icon="SEARCH_ICON.random"
                :label="SEARCH_TEXT.random"
                :aria-label="SEARCH_TEXT.randomLabel"
                :loading="isRandomLoading"
                color="neutral"
                variant="ghost"
                size="sm"
                @click.left.exact.prevent="showRandom"
              />

              <UButton
                v-if="trimmed"
                :icon="SEARCH_ICON.page"
                :label="SEARCH_TEXT.allResults"
                :to="allResultsLink"
                color="neutral"
                variant="ghost"
                size="sm"
                @click.left.exact="close"
              />
            </div>
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
