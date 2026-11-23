<script setup lang="ts" generic="Schema extends z.ZodType">
  import type { z } from 'zod';

  import type { CatalogOption, CatalogSearchSource } from '../model';

  import { useCatalogSearch } from '../composables';
  import { SHEET_ICON, SHEET_LABELS } from '../model';

  /**
   * Выбор записи справочника: поиск по разделу и список найденного. Выбор
   * закрывает окно.
   */
  const { title, source } = defineProps<{
    title: string;
    source: CatalogSearchSource<Schema>;
  }>();

  const emit = defineEmits<{
    pick: [option: CatalogOption];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { searchTerm, options, isLoading, reset } = useCatalogSearch(
    () => source,
  );

  const isEmpty = computed(
    () =>
      Boolean(searchTerm.value.trim())
      && !isLoading.value
      && !options.value.length,
  );

  const hint = computed(() =>
    isEmpty.value ? SHEET_LABELS.nothingFound : SHEET_LABELS.typeToSearch,
  );

  /**
   * Отдаёт выбранную запись и закрывает окно.
   * @param option - выбранная запись
   */
  function pick(option: CatalogOption): void {
    emit('pick', option);
    isOpen.value = false;
  }

  watch(isOpen, (open) => {
    if (!open) {
      reset();
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-lg', body: 'flex flex-col gap-3' }"
  >
    <template #body>
      <UInput
        v-model="searchTerm"
        :placeholder="SHEET_LABELS.search"
        :icon="SHEET_ICON.search"
        :loading="isLoading"
        autofocus
        class="w-full"
      />

      <ul
        v-if="options.length"
        class="flex max-h-96 flex-col gap-1 overflow-y-auto"
      >
        <li
          v-for="option in options"
          :key="option.url"
        >
          <button
            type="button"
            class="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-elevated"
            @click.left.exact.prevent="pick(option)"
          >
            <span class="text-highlighted">{{ option.name }}</span>

            <span
              v-if="option.caption"
              class="text-xs text-muted"
            >
              {{ option.caption }}
            </span>
          </button>
        </li>
      </ul>

      <p
        v-else
        class="py-6 text-center text-sm text-muted"
      >
        {{ hint }}
      </p>
    </template>
  </UModal>
</template>
