<script setup lang="ts" generic="T">
  import type { DetailType } from '~content/model';

  import type { CatalogAddSource, CatalogPreset, CatalogRow } from '../model';

  import { ContentEntityDrawer } from '~content/entity-drawer';
  import { SectionFilterDrawer } from '~section/filter-drawer';
  import { SectionSourcesDrawer } from '~section/sources-drawer';
  import { getApiErrorMessage } from '~user/model';

  import { useCatalogList } from '../composables';
  import {
    CATALOG_ADD_TEXT,
    groupCatalogRows,
    searchCatalogRows,
    SHEET_ICON,
  } from '../model';

  /**
   * Добавление из справочника, как на new.ttg.club: раздел целиком, поиск
   * на клиенте (с подстановкой при неверной раскладке), фильтр и источники
   * раздела, группы как в справочнике, выбор нескольких записей с пометкой
   * «уже есть», цена в строке и описание в дровере. Выбранное загружается
   * и отдаётся листу одним событием.
   */
  const {
    title,
    source,
    takenUrls,
    takenLabel = CATALOG_ADD_TEXT.added,
    loader,
    previewType,
    preset = undefined,
  } = defineProps<{
    title: string;
    source: CatalogAddSource;
    /** Адреса записей, что уже есть на листе. */
    takenUrls: ReadonlyArray<string>;
    /** Пометка записи, что уже есть на листе. */
    takenLabel?: string;
    /** Загружает запись для листа. */
    loader: (row: CatalogRow) => Promise<T>;
    /** Вид дровера описания по адресу записи. */
    previewType: (url: string) => DetailType | null;
    /** Выбор фильтра при открытии: класс и круги персонажа. */
    preset?: CatalogPreset;
  }>();

  const emit = defineEmits<{
    add: [items: Array<T>];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const toast = useToast();

  const {
    rows,
    isLoading,
    isError,
    selection,
    otherGroups,
    sourceGroups,
    isOtherCustomized,
    isSourcesCustomized,
    open,
    reload,
    setSelection,
    resetPart,
  } = useCatalogList(
    () => source,
    () => preset,
  );

  const search = ref('');
  const debouncedSearch = refDebounced(search, 150);
  const picked = ref<Array<string>>([]);
  const isAdding = ref(false);
  const isFilterOpen = ref(false);
  const isSourcesOpen = ref(false);
  const previewRow = ref<CatalogRow | null>(null);

  watch(isOpen, (value) => {
    if (value) {
      search.value = '';
      picked.value = [];
      void open();
    }
  });

  const taken = computed(() => new Set(takenUrls));

  const groups = computed(() =>
    groupCatalogRows(searchCatalogRows(rows.value, debouncedSearch.value)).map(
      (group) => ({
        ...group,
        rows: group.rows.map((row) => ({
          ...row,
          isPicked: picked.value.includes(row.url),
          isTaken: taken.value.has(row.url),
          details: [row.caption, row.source].filter(Boolean).join(' · '),
          className: picked.value.includes(row.url)
            ? 'border-primary/60 bg-primary/10'
            : 'border-default/50 hover:border-default',
        })),
      }),
    ),
  );

  const isEmpty = computed(
    () => !isLoading.value && !isError.value && !groups.value.length,
  );

  const addLabel = computed(() =>
    picked.value.length
      ? `${CATALOG_ADD_TEXT.add} (${picked.value.length})`
      : CATALOG_ADD_TEXT.add,
  );

  const previewDetailType = computed(() =>
    previewRow.value ? previewType(previewRow.value.url) : null,
  );

  const isPreviewOpen = computed({
    get: () => previewRow.value !== null,
    set: (value: boolean) => {
      if (!value) {
        previewRow.value = null;
      }
    },
  });

  /**
   * Отмечает запись или снимает отметку.
   * @param url - адрес записи
   */
  function togglePick(url: string): void {
    picked.value = picked.value.includes(url)
      ? picked.value.filter((entry) => entry !== url)
      : [...picked.value, url];
  }

  /**
   * Описание записи в дровере.
   * @param row - строка
   */
  function openPreview(row: CatalogRow): void {
    previewRow.value = row;
  }

  function clearPicked(): void {
    picked.value = [];
  }

  function openFilter(): void {
    isFilterOpen.value = true;
  }

  function openSources(): void {
    isSourcesOpen.value = true;
  }

  function resetOther(): void {
    resetPart('other');
  }

  function resetSources(): void {
    resetPart('sources');
  }

  function retry(): void {
    void reload();
  }

  /** Грузит выбранные записи и отдаёт их листу одним событием. */
  async function add(): Promise<void> {
    const selected = rows.value.filter((row) => picked.value.includes(row.url));

    if (!selected.length) {
      return;
    }

    isAdding.value = true;

    try {
      const items = await Promise.all(selected.map((row) => loader(row)));

      emit('add', items);
      isOpen.value = false;
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, CATALOG_ADD_TEXT.addFailed),
        color: 'error',
      });
    } finally {
      isAdding.value = false;
    }
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-2xl', body: 'flex flex-col gap-3' }"
  >
    <template #body>
      <div class="flex items-center gap-2">
        <UInput
          v-model="search"
          :icon="SHEET_ICON.search"
          :placeholder="CATALOG_ADD_TEXT.search"
          class="min-w-0 grow"
          autofocus
        />

        <UButton
          v-if="otherGroups.length"
          icon="tabler:filter"
          :aria-label="CATALOG_ADD_TEXT.filter"
          :color="isOtherCustomized ? 'primary' : 'neutral'"
          variant="subtle"
          @click.left.exact.prevent="openFilter"
        />

        <UButton
          v-if="sourceGroups.length"
          icon="tabler:books"
          :aria-label="CATALOG_ADD_TEXT.sources"
          :color="isSourcesCustomized ? 'primary' : 'neutral'"
          variant="subtle"
          @click.left.exact.prevent="openSources"
        />
      </div>

      <div
        class="flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto pr-1"
      >
        <div
          v-if="isLoading"
          class="flex flex-col gap-2"
        >
          <USkeleton
            v-for="index in 6"
            :key="index"
            class="h-10 w-full"
          />
        </div>

        <UEmpty
          v-else-if="isError"
          icon="tabler:alert-triangle"
          :title="CATALOG_ADD_TEXT.error"
          variant="naked"
        >
          <template #actions>
            <UButton
              :label="CATALOG_ADD_TEXT.retry"
              color="neutral"
              variant="subtle"
              @click.left.exact.prevent="retry"
            />
          </template>
        </UEmpty>

        <p
          v-else-if="isEmpty"
          class="py-8 text-center text-sm text-dimmed"
        >
          {{ CATALOG_ADD_TEXT.empty }}
        </p>

        <template v-else>
          <div
            v-for="group in groups"
            :key="group.title"
            class="flex flex-col gap-1"
          >
            <span
              v-if="group.title"
              class="sticky top-0 z-10 bg-default/95 py-1 text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ group.title }}
            </span>

            <div
              v-for="row in group.rows"
              :key="row.url"
              class="flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors"
              :class="row.className"
            >
              <UCheckbox
                :model-value="row.isPicked"
                :aria-label="`${CATALOG_ADD_TEXT.select}: ${row.name}`"
                @update:model-value="togglePick(row.url)"
              />

              <button
                type="button"
                class="flex min-w-0 grow cursor-pointer flex-col text-left"
                @click.left.exact.prevent="togglePick(row.url)"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <span class="truncate text-sm font-medium text-highlighted">
                    {{ row.name }}
                  </span>

                  <UBadge
                    v-if="row.isTaken"
                    :label="takenLabel"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="shrink-0"
                  />
                </span>

                <span
                  v-if="row.details"
                  class="truncate text-xs text-dimmed"
                >
                  {{ row.details }}
                </span>
              </button>

              <span
                v-if="row.price"
                class="shrink-0 text-xs text-toned"
              >
                {{ row.price }}
              </span>

              <UButton
                icon="tabler:eye"
                :aria-label="`${CATALOG_ADD_TEXT.preview}: ${row.name}`"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                @click.left.exact.prevent="openPreview(row)"
              />
            </div>
          </div>
        </template>
      </div>

      <SectionFilterDrawer
        v-model:open="isFilterOpen"
        :groups="otherGroups"
        :selection="selection"
        :is-customized="isOtherCustomized"
        @update:selection="setSelection"
        @reset="resetOther"
      />

      <SectionSourcesDrawer
        v-model:open="isSourcesOpen"
        :groups="sourceGroups"
        :selection="selection"
        :is-customized="isSourcesCustomized"
        @update:selection="setSelection"
        @reset="resetSources"
      />

      <ContentEntityDrawer
        v-if="previewRow && previewDetailType"
        v-model:open="isPreviewOpen"
        :type="previewDetailType"
        :path="previewRow.url"
        :title="previewRow.name"
      />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          v-if="picked.length"
          :label="CATALOG_ADD_TEXT.clear"
          color="neutral"
          variant="link"
          class="mr-auto"
          @click.left.exact.prevent="clearPicked"
        />

        <UButton
          :label="CATALOG_ADD_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="addLabel"
          :icon="SHEET_ICON.add"
          :loading="isAdding"
          :disabled="!picked.length"
          @click.left.exact.prevent="add"
        />
      </div>
    </template>
  </UModal>
</template>
