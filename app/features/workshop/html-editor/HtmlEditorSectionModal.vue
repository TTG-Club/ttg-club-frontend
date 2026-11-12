<script setup lang="ts">
  import type { SearchResult } from '~infrastructure/search/model';

  import type { HtmlEditorLink } from '../model';

  import { useSiteSearch } from '~infrastructure/search/composables';

  import {
    HTML_EDITOR_TEXT,
    SECTION_SEARCH_DEBOUNCE_MS,
    SECTION_SEARCH_SIZE,
  } from '../model';

  /**
   * Окно ссылки на раздел: поиск записи по сайту. Выбранная запись
   * вставляется ссылкой, которая открывает её карточку.
   */
  const { text } = defineProps<{
    /** Выделенный текст: им станет текст ссылки. */
    text: string;
  }>();

  const emit = defineEmits<{
    apply: [link: HtmlEditorLink];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const term = ref('');
  const linkText = ref('');
  const query = refDebounced(term, SECTION_SEARCH_DEBOUNCE_MS);
  const trimmed = computed(() => term.value.trim());

  const { data, status, error } = useSiteSearch({
    key: 'workshop-section-link',
    term: query,
    size: SECTION_SEARCH_SIZE,
    server: false,
  });

  const results = computed(() => (trimmed.value ? data.value.items : []));

  const statusText = computed(() => {
    if (!trimmed.value) {
      return HTML_EDITOR_TEXT.sectionStart;
    }

    if (status.value === 'pending' || trimmed.value !== query.value.trim()) {
      return HTML_EDITOR_TEXT.sectionLoading;
    }

    if (error.value) {
      return HTML_EDITOR_TEXT.sectionError;
    }

    return results.value.length ? '' : HTML_EDITOR_TEXT.sectionEmpty;
  });

  // Выделенный текст сразу ищется и остаётся текстом ссылки
  watch(isOpen, (opened) => {
    if (opened) {
      term.value = text;
      linkText.value = text;
    }
  });

  function select(result: SearchResult): void {
    emit('apply', {
      text: linkText.value.trim() || result.name,
      url: result.url,
    });
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="HTML_EDITOR_TEXT.sectionTitle"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="HTML_EDITOR_TEXT.sectionSearch">
          <UInput
            v-model="term"
            :placeholder="HTML_EDITOR_TEXT.sectionSearchPlaceholder"
            icon="tabler:search"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField :label="HTML_EDITOR_TEXT.sectionText">
          <UInput
            v-model="linkText"
            :placeholder="HTML_EDITOR_TEXT.sectionTextPlaceholder"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="statusText"
          class="py-2 text-center text-sm text-muted"
        >
          {{ statusText }}
        </p>

        <ul
          v-else
          class="flex flex-col gap-0.5"
        >
          <li
            v-for="result in results"
            :key="result.url"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none"
              @click.left.exact.prevent="select(result)"
            >
              <span class="min-w-0">
                <span class="block truncate text-highlighted">
                  {{ result.name }}
                </span>

                <span
                  v-if="result.englishName"
                  class="block truncate text-xs text-muted"
                >
                  {{ result.englishName }}
                </span>
              </span>

              <UBadge
                :label="result.section"
                color="neutral"
                variant="subtle"
                size="sm"
                class="shrink-0"
              />
            </button>
          </li>
        </ul>
      </div>
    </template>
  </UModal>
</template>
