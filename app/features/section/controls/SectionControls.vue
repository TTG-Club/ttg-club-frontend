<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    FilterDefinition,
    FilterPart,
    FilterSelection,
    SectionGroupingOption,
  } from '../model';

  import { SectionFilterDrawer } from '../filter-drawer';
  import { isPartCustomized, SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Поиск и фильтр раздела строкой в шапке над списком, как в старом SPA:
   * поиск, кнопки фильтра и источников, меню «Ещё». Фильтр и источники
   * открываются панелью сбоку. Группировка списка, если раздел её задаёт, —
   * подменю в «Ещё».
   */
  const {
    definition = undefined,
    selection,
    isCustomized = false,
    groupingOptions = undefined,
  } = defineProps<{
    definition?: FilterDefinition | null;
    selection: FilterSelection;
    isCustomized?: boolean;
    /** Варианты группировки списка; без них пункта в меню нет. */
    groupingOptions?: Array<SectionGroupingOption>;
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

  const isDrawerOpen = ref(false);

  // Часть остаётся после закрытия, чтобы панель не менялась на анимации
  const drawerPart = ref<FilterPart>('other');

  const otherGroups = computed(
    () => definition?.other.filter((group) => !group.hidden) ?? [],
  );

  const hasOther = computed(() => otherGroups.value.length > 0);

  const hasSources = computed(
    () => !!definition?.sources.some((group) => !group.hidden),
  );

  const isOtherCustomized = computed(
    () => !!definition && isPartCustomized(definition, selection, 'other'),
  );

  const isSourcesCustomized = computed(
    () => !!definition && isPartCustomized(definition, selection, 'sources'),
  );

  const isDrawerPartCustomized = computed(() =>
    drawerPart.value === 'sources'
      ? isSourcesCustomized.value
      : isOtherCustomized.value,
  );

  /**
   * Открывает панель части фильтра.
   * @param part - источники или условия по содержимому
   */
  function openDrawer(part: FilterPart) {
    drawerPart.value = part;
    isDrawerOpen.value = true;
  }

  function openFilter() {
    openDrawer('other');
  }

  function openSources() {
    openDrawer('sources');
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
      v-if="hasOther"
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

    <SectionFilterDrawer
      v-if="definition"
      v-model:open="isDrawerOpen"
      :part="drawerPart"
      :definition="definition"
      :selection="selection"
      :is-customized="isDrawerPartCustomized"
      @update:selection="emit('update:selection', $event)"
      @reset="emit('reset', drawerPart)"
    />
  </div>
</template>
