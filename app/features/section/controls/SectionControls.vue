<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { FilterDefinition, FilterPart, FilterSelection } from '../model';

  import { SectionFilterDrawer } from '../filter-drawer';
  import { SectionFilterInline } from '../filter-inline';
  import { isPartCustomized, SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Поиск и фильтр раздела в левой колонке, как на new.ttg.club: строка с
   * поиском, источниками и меню «Ещё», под ней фильтр по содержимому
   * группами. На узком экране колонка становится строкой над списком, и
   * фильтр открывается кнопкой в панели.
   */
  const {
    definition = undefined,
    selection,
    isCustomized = false,
  } = defineProps<{
    definition?: FilterDefinition | null;
    selection: FilterSelection;
    isCustomized?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selection': [selection: FilterSelection];
    /** Сброс одной части фильтра или, без неё, всего фильтра. */
    'reset': [part?: FilterPart];
  }>();

  const search = defineModel<string>('search', { required: true });

  defineSlots<{
    /** Настройки списка под поиском, например переключатель группировки. */
    toolbar?: () => unknown;
  }>();

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

  function resetOther() {
    emit('reset', 'other');
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

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
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

      <!-- Кнопка фильтра — только на узком экране: на широком он в колонке -->
      <UTooltip
        v-if="hasOther"
        :text="SECTION_TEXT.filter"
      >
        <UChip
          :show="isOtherCustomized"
          inset
          class="lg:hidden"
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

    <slot name="toolbar" />

    <template v-if="hasOther">
      <USeparator class="hidden lg:flex" />

      <SectionFilterInline
        :groups="otherGroups"
        :selection="selection"
        :is-customized="isOtherCustomized"
        class="hidden lg:flex"
        @update:selection="emit('update:selection', $event)"
        @reset="resetOther"
      />
    </template>

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
