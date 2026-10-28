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
   * Окно быстрого поиска, как в старом SPA: строка поиска в рамке, первые
   * результаты или подсказка, а под ними переход на страницу поиска.
   * Кубик справа от строки показывает случайные записи.
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

  /** Подсказка вместо результатов: пока пусто, грузится или не нашлось. */
  const statusText = computed(() => {
    if (!trimmed.value && !isRandomLoading.value && !isRandomError.value) {
      return randomResults.value.length ? '' : SEARCH_TEXT.start;
    }

    if (isLoading.value) {
      return SEARCH_TEXT.loading;
    }

    if (isError.value) {
      return SEARCH_TEXT.error;
    }

    return results.value.length ? '' : SEARCH_TEXT.empty;
  });

  const total = computed(() => (trimmed.value ? data.value.total : 0));

  const pageLink = computed(() => ({
    path: SEARCH_PAGE_PATH,
    query: trimmed.value ? { [SEARCH_QUERY_KEY]: trimmed.value } : undefined,
  }));

  const groups = computed<Array<CommandPaletteGroup<SearchPaletteItem>>>(() => [
    {
      id: 'results',
      ignoreFilter: true,
      items: statusText.value
        ? [
            {
              label: statusText.value,
              slot: 'status',
              disabled: true,
              class: 'justify-center opacity-100',
            },
          ]
        : results.value.map((result) => ({
            label: result.name,
            suffix: result.englishName ? `[${result.englishName}]` : undefined,
            description: result.section,
            to: result.url,
            result,
          })),
    },
    {
      id: 'page',
      ignoreFilter: true,
      items: [
        {
          label: SEARCH_TEXT.openPage,
          icon: SEARCH_ICON.page,
          suffix: total.value
            ? `${SEARCH_TEXT.found} ${total.value}`
            : undefined,
          to: pageLink.value,
        },
      ],
    },
  ]);

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

  /** Строка в рамке, а справа от неё, за рамкой, кнопка с кубиком. */
  const SEARCH_INPUT = {
    variant: 'outline',
    size: 'lg',
    class: 'w-full',
    ui: { base: 'pe-3', trailing: 'pe-2' },
  } as const;

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
        :input="SEARCH_INPUT"
        :ui="{ root: 'divide-y-0', input: 'p-2 pe-12', viewport: 'divide-y-0' }"
        @update:model-value="close"
      >
        <template #close>
          <UTooltip :text="SEARCH_TEXT.random">
            <UButton
              :icon="SEARCH_ICON.random"
              :aria-label="SEARCH_TEXT.random"
              :loading="isRandomLoading"
              color="neutral"
              variant="ghost"
              size="lg"
              @click.left.exact.prevent="showRandom"
            />
          </UTooltip>
        </template>

        <template #status="{ item }">
          <p class="w-full py-4 text-center text-sm text-muted">
            {{ item.label }}
          </p>
        </template>

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
      </UCommandPalette>
    </template>
  </UModal>
</template>
