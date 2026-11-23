<script setup lang="ts" generic="Schema extends z.ZodType">
  import type { z } from 'zod';

  import type { CatalogOption, CatalogTreeSource } from '../model';

  import { useCatalogTree } from '../composables';
  import { CATALOG_TREE_ICON, CATALOG_TREE_TEXT, SHEET_ICON } from '../model';

  /**
   * Выбор записи справочника деревом, как окно «Добавление класса» core-app:
   * поиск по названию, список по алфавиту с раскрытием до вложенных записей,
   * книга-источник и ссылка на страницу записи, подсказка под списком.
   * Подвал: «Свой …» слева, «Отмена» и подтверждение справа.
   */
  const {
    title,
    source,
    hint,
    confirmLabel,
    confirmIcon = undefined,
    customLabel,
    expandLabel,
    childrenSelectable = false,
    excludedUrls = [],
  } = defineProps<{
    title: string;
    source: CatalogTreeSource<Schema>;
    hint: string;
    confirmLabel: string;
    confirmIcon?: string;
    customLabel: string;
    expandLabel: string;
    /** Вложенные записи можно выбрать (разновидность расы), а не только смотреть. */
    childrenSelectable?: boolean;
    /** Записи, которых не должно быть в списке: уже взятые классы. */
    excludedUrls?: ReadonlyArray<string>;
  }>();

  const emit = defineEmits<{
    pick: [option: CatalogOption];
    custom: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const {
    rows,
    selected,
    searchTerm,
    isLoading,
    hasError,
    load,
    toggle,
    select,
    reset,
  } = useCatalogTree(source, () => excludedUrls);

  const emptyText = computed(() =>
    hasError.value ? CATALOG_TREE_TEXT.loadFailed : CATALOG_TREE_TEXT.empty,
  );

  /**
   * Выбирает вложенную запись, если это разрешено.
   * @param url - адрес записи
   */
  function selectChild(url: string): void {
    if (childrenSelectable) {
      select(url);
    }
  }

  function confirm(): void {
    if (selected.value) {
      emit('pick', selected.value);
      isOpen.value = false;
    }
  }

  function openCustom(): void {
    isOpen.value = false;
    emit('custom');
  }

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (open) => {
    if (open) {
      void load();
    } else {
      reset();
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'sm:max-w-2xl', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <UInput
        v-model="searchTerm"
        :placeholder="CATALOG_TREE_TEXT.searchPlaceholder"
        :icon="SHEET_ICON.search"
        autofocus
        class="w-full"
      />

      <div
        v-if="isLoading"
        class="flex justify-center py-10"
      >
        <UIcon
          :name="SHEET_ICON.loading"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <div
        v-else
        class="flex max-h-96 flex-col gap-1 overflow-y-auto pr-1"
      >
        <template
          v-for="row in rows"
          :key="row.url"
        >
          <div
            class="flex items-center gap-1 rounded-md pr-2 transition-colors"
            :class="row.rowClass"
          >
            <UButton
              v-if="row.children.length"
              :icon="CATALOG_TREE_ICON.expand"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              class="shrink-0"
              :aria-label="`${expandLabel}: ${row.name}`"
              :aria-expanded="row.isExpanded"
              :ui="{ leadingIcon: `transition-transform ${row.chevronClass}` }"
              @click.left.exact.prevent="toggle(row.url)"
            />

            <span
              v-else
              class="size-7 shrink-0"
            />

            <button
              type="button"
              class="flex min-w-0 grow cursor-pointer items-center py-2 pr-1 text-left"
              :aria-label="`${CATALOG_TREE_TEXT.pick}: ${row.name}`"
              @click.left.exact.prevent="select(row.url)"
            >
              <span
                class="grow truncate text-sm font-semibold text-highlighted"
              >
                {{ row.name }}
              </span>
            </button>

            <UBadge
              v-if="row.sourceLabel"
              :label="row.sourceLabel"
              size="sm"
              color="neutral"
              variant="outline"
              class="shrink-0"
            />

            <UTooltip :text="CATALOG_TREE_TEXT.preview">
              <UButton
                :icon="CATALOG_TREE_ICON.preview"
                :to="row.url"
                target="_blank"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="shrink-0"
                :aria-label="`${CATALOG_TREE_TEXT.preview}: ${row.name}`"
              />
            </UTooltip>

            <UIcon
              v-if="row.isSelected"
              :name="CATALOG_TREE_ICON.selected"
              class="size-4 shrink-0 text-primary"
            />
          </div>

          <div
            v-if="row.isExpanded && row.children.length"
            class="ml-5 flex flex-col gap-1 border-l border-default/50 pl-2"
          >
            <div
              v-for="child in row.children"
              :key="child.url"
              class="flex items-center gap-1 rounded-md pr-2 transition-colors"
              :class="child.rowClass"
            >
              <button
                v-if="childrenSelectable"
                type="button"
                class="flex min-w-0 grow cursor-pointer items-center px-3 py-1.5 text-left"
                :aria-label="`${CATALOG_TREE_TEXT.pick}: ${child.name}`"
                @click.left.exact.prevent="selectChild(child.url)"
              >
                <span class="grow truncate text-sm text-toned">
                  {{ child.name }}
                </span>
              </button>

              <span
                v-else
                class="flex min-w-0 grow items-center px-3 py-1.5"
              >
                <span class="grow truncate text-sm text-dimmed">
                  {{ child.name }}
                </span>
              </span>

              <UBadge
                v-if="child.sourceLabel"
                :label="child.sourceLabel"
                size="sm"
                color="neutral"
                variant="outline"
                class="shrink-0"
              />

              <UTooltip :text="CATALOG_TREE_TEXT.preview">
                <UButton
                  :icon="CATALOG_TREE_ICON.preview"
                  :to="child.url"
                  target="_blank"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="shrink-0"
                  :aria-label="`${CATALOG_TREE_TEXT.preview}: ${child.name}`"
                />
              </UTooltip>

              <UIcon
                v-if="child.isSelected"
                :name="CATALOG_TREE_ICON.selected"
                class="size-4 shrink-0 text-primary"
              />
            </div>
          </div>
        </template>

        <span
          v-if="!rows.length"
          class="px-3 py-6 text-center text-sm text-dimmed"
        >
          {{ emptyText }}
        </span>
      </div>

      <span class="text-xs text-muted">{{ hint }}</span>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          :label="customLabel"
          :icon="CATALOG_TREE_ICON.add"
          color="neutral"
          variant="outline"
          @click.left.exact.prevent="openCustom"
        />

        <div class="ml-auto flex gap-2">
          <UButton
            :label="CATALOG_TREE_TEXT.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="close"
          />

          <UButton
            :label="confirmLabel"
            :icon="confirmIcon"
            color="primary"
            :disabled="!selected"
            @click.left.exact.prevent="confirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
