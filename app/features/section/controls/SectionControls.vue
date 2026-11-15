<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    FilterDefinition,
    FilterPart,
    FilterSelection,
    SectionGroupingOption,
  } from '../model';

  import { SectionFilterDrawer } from '../filter-drawer';
  import { SectionFilterInline } from '../filter-inline';
  import { isPartCustomized, SECTION_ICON, SECTION_TEXT } from '../model';
  import { SectionSourcesDrawer } from '../sources-drawer';

  /**
   * Поиск и фильтр раздела строкой в шапке над списком, как в старом SPA:
   * поиск, кнопки фильтра и источников, меню «Ещё». Фильтр и источники
   * открываются панелью сбоку. Группировка списка, если раздел её задаёт, —
   * подменю в «Ещё».
   *
   * В колонке фильтров (раскладки с фильтрами слева или справа) фильтр по
   * содержимому стоит прямо под строкой поиска группами, как на
   * new.ttg.club, и отдельной кнопки у него нет.
   */
  const {
    definition = undefined,
    selection,
    isCustomized = false,
    groupingOptions = undefined,
    isInline = false,
    isFilterSearchDisabled = false,
  } = defineProps<{
    definition?: FilterDefinition | null;
    selection: FilterSelection;
    isCustomized?: boolean;
    /** Варианты группировки списка; без них пункта в меню нет. */
    groupingOptions?: Array<SectionGroupingOption>;
    /** Колонка фильтров: фильтр по содержимому — группами под поиском. */
    isInline?: boolean;
    /** Без поиска по фильтру по содержимому. */
    isFilterSearchDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selection': [selection: FilterSelection];
    /** Сброс одной части фильтра или, без неё, всего фильтра. */
    'reset': [part?: FilterPart];
  }>();

  const search = defineModel<string>('search', { required: true });

  const grouping = defineModel<string>('grouping');

  const route = useRoute();
  const siteConfig = useSiteConfig();
  const toast = useToast();
  const { copy, isSupported } = useClipboard({ legacy: true });

  const isFilterOpen = ref(false);

  const isSourcesOpen = ref(false);

  const otherGroups = computed(
    () => definition?.other.filter((group) => !group.hidden) ?? [],
  );

  const hasOther = computed(() => otherGroups.value.length > 0);

  const isOtherButtonVisible = computed(() => hasOther.value && !isInline);

  const isOtherInline = computed(() => hasOther.value && isInline);

  const sourceGroups = computed(
    () => definition?.sources.filter((group) => !group.hidden) ?? [],
  );

  const hasSources = computed(() => sourceGroups.value.length > 0);

  const isOtherCustomized = computed(
    () => !!definition && isPartCustomized(definition, selection, 'other'),
  );

  const isSourcesCustomized = computed(
    () => !!definition && isPartCustomized(definition, selection, 'sources'),
  );

  /** Открывает панель фильтра по содержимому. */
  function openFilter() {
    isFilterOpen.value = true;
  }

  /** Открывает панель источников. */
  function openSources() {
    isSourcesOpen.value = true;
  }

  function updateSelection(next: FilterSelection) {
    emit('update:selection', next);
  }

  function resetOther() {
    emit('reset', 'other');
  }

  /** Возвращает источники к выбору по умолчанию. */
  function resetSources() {
    emit('reset', 'sources');
  }

  /** Копирует ссылку на раздел с текущими поиском и фильтром. */
  async function copyLink() {
    if (!isSupported.value) {
      toast.add({ title: SECTION_TEXT.copyError, color: 'error' });

      return;
    }

    try {
      await copy(`${siteConfig.url}${route.fullPath}`);

      toast.add({ title: SECTION_TEXT.linkCopied, icon: SECTION_ICON.copy });
    } catch {
      toast.add({ title: SECTION_TEXT.copyError, color: 'error' });
    }
  }

  /**
   * Пункт подменю группировки.
   * @param option - вариант группировки
   */
  function getGroupingItem({
    value,
    label,
    icon,
  }: SectionGroupingOption): DropdownMenuItem {
    return {
      label,
      icon,
      type: 'checkbox',
      checked: grouping.value === value,
      onSelect: () => {
        grouping.value = value;
      },
    };
  }

  const groupingItems = computed<Array<DropdownMenuItem>>(() =>
    groupingOptions?.length
      ? [
          {
            label: SECTION_TEXT.grouping,
            icon: SECTION_ICON.grouping,
            children: groupingOptions.map(getGroupingItem),
          },
        ]
      : [],
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    ...groupingItems.value,
    {
      label: SECTION_TEXT.copyLink,
      icon: SECTION_ICON.copy,
      onSelect: copyLink,
    },
    {
      label: SECTION_TEXT.resetAll,
      icon: SECTION_ICON.reset,
      disabled: !isCustomized,
      onSelect: () => emit('reset'),
    },
  ]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2">
      <UInput
        v-model="search"
        :icon="SECTION_ICON.search"
        :placeholder="SECTION_TEXT.searchPlaceholder"
        :aria-label="SECTION_TEXT.searchLabel"
        type="search"
        autocomplete="off"
        class="min-w-0 flex-auto"
      />

      <UTooltip
        v-if="isOtherButtonVisible"
        :text="SECTION_TEXT.filter"
      >
        <UChip
          :show="isOtherCustomized"
          inset
        >
          <UButton
            :icon="SECTION_ICON.filter"
            :aria-label="SECTION_TEXT.filter"
            variant="subtle"
            square
            @click.left.exact.prevent="openFilter"
          />
        </UChip>
      </UTooltip>

      <UTooltip
        v-if="hasSources"
        :text="SECTION_TEXT.sources"
      >
        <UChip
          :show="isSourcesCustomized"
          inset
        >
          <UButton
            :icon="SECTION_ICON.sources"
            :aria-label="SECTION_TEXT.sources"
            variant="subtle"
            square
            @click.left.exact.prevent="openSources"
          />
        </UChip>
      </UTooltip>

      <UDropdownMenu
        :items="menuItems"
        :ui="{ content: 'w-64' }"
      >
        <UButton
          :icon="SECTION_ICON.more"
          :aria-label="SECTION_TEXT.more"
          variant="subtle"
          square
        />
      </UDropdownMenu>
    </div>

    <SectionFilterInline
      v-if="isOtherInline"
      :groups="otherGroups"
      :selection="selection"
      :is-customized="isOtherCustomized"
      :is-search-disabled="isFilterSearchDisabled"
      @update:selection="updateSelection"
      @reset="resetOther"
    />

    <SectionFilterDrawer
      v-if="isOtherButtonVisible"
      v-model:open="isFilterOpen"
      :groups="otherGroups"
      :selection="selection"
      :is-customized="isOtherCustomized"
      :is-search-disabled="isFilterSearchDisabled"
      @update:selection="updateSelection"
      @reset="resetOther"
    />

    <SectionSourcesDrawer
      v-if="hasSources"
      v-model:open="isSourcesOpen"
      :groups="sourceGroups"
      :selection="selection"
      :is-customized="isSourcesCustomized"
      @update:selection="updateSelection"
      @reset="resetSources"
    />
  </div>
</template>
