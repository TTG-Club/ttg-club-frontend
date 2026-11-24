<script setup lang="ts" generic="Schema extends z.ZodType">
  import type { z } from 'zod';

  import type { EntityPaneType } from '~content/model';

  import type {
    CatalogOption,
    CatalogTreeSource,
    WIZARD_STEPS,
  } from '../model';

  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';
  import { ContentEntityPane } from '~content/entity-drawer';

  import { useCatalogTree } from '../composables';
  import {
    CATALOG_TREE_ICON,
    CATALOG_TREE_TEXT,
    SHEET_ICON,
    WIZARD_TEXT,
  } from '../model';

  /**
   * Мастер выбора записи справочника, как мастера core-app: на первом шаге —
   * поиск, список деревом с раскрытием до вложенных записей и описание
   * выбранной панелью рядом (на узком экране — ссылкой на страницу); на
   * втором — итог, который заполняет родитель через слот `review`.
   * Подвал: «Свой …» или «Назад» слева, «Отмена» и «Далее» / «Применить»
   * справа.
   */
  const {
    title,
    source,
    paneType,
    hint,
    customLabel,
    expandLabel,
    childrenSelectable = false,
    excludedUrls = [],
    isPreparing = false,
    reviewTitle = '',
  } = defineProps<{
    title: string;
    source: CatalogTreeSource<Schema>;
    /** Карточка описания записи в панели. */
    paneType: EntityPaneType;
    hint: string;
    customLabel: string;
    expandLabel: string;
    /** Вложенные записи можно выбрать (разновидность, подкласс), а не только смотреть. */
    childrenSelectable?: boolean;
    /** Записи, которых не должно быть в списке: уже взятые классы. */
    excludedUrls?: ReadonlyArray<string>;
    /** Готовится итог: «Далее» крутится. */
    isPreparing?: boolean;
    /** Что выбрано — подпись над итогом. */
    reviewTitle?: string;
  }>();

  const emit = defineEmits<{
    /** Переход к итогу: родитель готовит черновик и ставит шаг `review`. */
    next: [option: CatalogOption];
    custom: [];
    apply: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const step = defineModel<(typeof WIZARD_STEPS)[number]>('step', {
    default: 'pick',
  });

  defineSlots<{
    review: () => unknown;
    /** Под списком первого шага: предупреждения о выбранной записи. */
    note: (props: { selected: CatalogOption | null }) => unknown;
  }>();

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

  const isWide = useMediaQuery(LAYOUT_DRAWER_QUERY);

  /** Запись, чьё описание показано в панели. */
  const previewUrl = ref<string | null>(null);

  const emptyText = computed(() =>
    hasError.value ? CATALOG_TREE_TEXT.loadFailed : CATALOG_TREE_TEXT.empty,
  );

  const modalUi = computed(() => ({
    content:
      step.value === 'pick' && isWide.value ? 'sm:max-w-5xl' : 'sm:max-w-3xl',
    body: 'flex flex-col gap-4',
  }));

  /**
   * Выбирает запись и показывает её описание.
   * @param url - адрес записи
   */
  function pick(url: string): void {
    select(url);
    previewUrl.value = url;
  }

  /**
   * Выбирает вложенную запись, если это разрешено, иначе только показывает.
   * @param url - адрес записи
   */
  function pickChild(url: string): void {
    if (childrenSelectable) {
      select(url);
    }

    previewUrl.value = url;
  }

  /**
   * Описание записи: панелью на широком экране.
   * @param url - адрес записи
   */
  function preview(url: string): void {
    previewUrl.value = url;
  }

  function goNext(): void {
    if (selected.value) {
      emit('next', selected.value);
    }
  }

  function goBack(): void {
    step.value = 'pick';
  }

  function openCustom(): void {
    isOpen.value = false;
    emit('custom');
  }

  function apply(): void {
    emit('apply');
  }

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (open) => {
    if (open) {
      step.value = 'pick';
      void load();
    } else {
      reset();
      previewUrl.value = null;
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="modalUi"
  >
    <template #body>
      <template v-if="step === 'pick'">
        <UInput
          v-model="searchTerm"
          :placeholder="CATALOG_TREE_TEXT.searchPlaceholder"
          :icon="SHEET_ICON.search"
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
          class="flex max-h-[60dvh] min-h-72 gap-4"
        >
          <div
            class="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-y-auto pr-1"
            :class="{ 'md:basis-5/12': isWide }"
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
                  :ui="{
                    leadingIcon: `transition-transform ${row.chevronClass}`,
                  }"
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
                  @click.left.exact.prevent="pick(row.url)"
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

                <UTooltip
                  v-if="isWide"
                  :text="CATALOG_TREE_TEXT.preview"
                >
                  <UButton
                    :icon="CATALOG_TREE_ICON.preview"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    class="shrink-0"
                    :aria-label="`${CATALOG_TREE_TEXT.preview}: ${row.name}`"
                    @click.left.exact.prevent="preview(row.url)"
                  />
                </UTooltip>

                <UButton
                  v-else
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
                    type="button"
                    class="flex min-w-0 grow cursor-pointer items-center px-3 py-1.5 text-left"
                    :aria-label="`${CATALOG_TREE_TEXT.pick}: ${child.name}`"
                    @click.left.exact.prevent="pickChild(child.url)"
                  >
                    <span class="grow truncate text-sm text-toned">
                      {{ child.name }}
                    </span>
                  </button>

                  <UBadge
                    v-if="child.sourceLabel"
                    :label="child.sourceLabel"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    class="shrink-0"
                  />

                  <UButton
                    v-if="!isWide"
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

          <div
            v-if="isWide"
            class="flex min-h-0 min-w-0 basis-7/12 flex-col overflow-y-auto rounded-md border border-default p-4"
          >
            <ContentEntityPane
              v-if="previewUrl"
              :key="previewUrl"
              :type="paneType"
              :path="previewUrl"
            />

            <p
              v-else
              class="grid grow place-items-center text-center text-sm text-dimmed"
            >
              {{ WIZARD_TEXT.previewPlaceholder }}
            </p>
          </div>
        </div>

        <slot
          name="note"
          :selected="selected"
        />

        <span class="text-xs text-muted">{{ hint }}</span>
      </template>

      <template v-else>
        <div
          v-if="reviewTitle"
          class="flex flex-wrap items-center gap-2 text-sm"
        >
          <span class="text-muted">{{ WIZARD_TEXT.chosen }}:</span>

          <span class="font-bold text-highlighted">{{ reviewTitle }}</span>
        </div>

        <slot name="review" />
      </template>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          v-if="step === 'review'"
          :label="WIZARD_TEXT.back"
          icon="tabler:arrow-left"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="goBack"
        />

        <UButton
          v-else
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
            v-if="step === 'review'"
            :label="WIZARD_TEXT.apply"
            color="primary"
            @click.left.exact.prevent="apply"
          />

          <UButton
            v-else
            :label="CATALOG_TREE_TEXT.next"
            :icon="CATALOG_TREE_ICON.next"
            color="primary"
            :loading="isPreparing"
            :disabled="!selected"
            @click.left.exact.prevent="goNext"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
