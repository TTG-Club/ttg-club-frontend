<script setup lang="ts">
  import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';

  import type { SearchResult } from '../model';

  import { useSiteSearch } from '../composables';
  import {
    SEARCH_DEBOUNCE_MS,
    SEARCH_ICON,
    SEARCH_PAGE_PATH,
    SEARCH_PALETTE_SIZE,
    SEARCH_QUERY_KEY,
    SEARCH_TEXT,
  } from '../model';

  interface SearchPaletteItem extends CommandPaletteItem {
    result?: SearchResult;
  }

  /**
   * Окно быстрого поиска, как в старом SPA: строка поиска в рамке, первые
   * результаты или подсказка, а под ними переход на страницу поиска.
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

  const results = computed(() => (trimmed.value ? data.value.items : []));

  const isLoading = computed(
    () =>
      !!trimmed.value
      && (status.value === 'pending' || trimmed.value !== query.value.trim()),
  );

  const isError = computed(() => !!trimmed.value && !!searchError.value);

  /** Подсказка вместо результатов: пока пусто, грузится или не нашлось. */
  const statusText = computed(() => {
    if (!trimmed.value) {
      return SEARCH_TEXT.start;
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

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (value) => {
    if (!value) {
      term.value = '';
    }
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
        :input="{ variant: 'outline', size: 'lg', class: 'w-full' }"
        :ui="{ root: 'divide-y-0', input: 'p-2', viewport: 'divide-y-0' }"
        @update:model-value="close"
      >
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
