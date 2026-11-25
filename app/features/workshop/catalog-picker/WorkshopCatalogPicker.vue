<script setup lang="ts">
  import type { DetailType } from '~content/model';
  import type { SectionConfig } from '~section/model';

  import type { CatalogPickerEntry } from '../model';

  import { useCatalogPickerNames } from '../composables';
  import {
    CATALOG_PICKER_CHIPS_LIMIT,
    CATALOG_PICKER_ICON,
    CATALOG_PICKER_TEXT,
  } from '../model';
  import WorkshopCatalogPickerModal from './WorkshopCatalogPickerModal.vue';

  /**
   * Поле выбора записей раздела, как на new.ttg.club: кнопка открывает окно
   * с поиском и фильтрами раздела, выбранное — чипами рядом. Значение —
   * адреса страниц записей без раздела.
   */
  const {
    section,
    title,
    previewType,
    placeholder = '',
  } = defineProps<{
    /** Раздел справочника: ручки списка и фильтра. */
    section: SectionConfig;
    /** Заголовок окна выбора. */
    title: string;
    /** Карточка записи в дровере описания. */
    previewType: DetailType;
    /** Подпись пустого поля; пусто — общая. */
    placeholder?: string;
  }>();

  const model = defineModel<Array<string>>({ required: true });

  const overlay = useOverlay();

  const { known, remember } = useCatalogPickerNames(
    () => section,
    () => model.value,
  );

  const chips = computed<Array<CatalogPickerEntry>>(() =>
    model.value.map(
      (slug) => known.value[slug] ?? { slug, name: slug, nameEng: '' },
    ),
  );

  /**
   * Показаны ли все чипы: набранный десяток стеной чипов прятал бы форму,
   * а состав выбора смотрят на вкладке «Выбранные» в окне.
   */
  const isExpanded = ref(false);

  const visibleChips = computed(() =>
    isExpanded.value || chips.value.length <= CATALOG_PICKER_CHIPS_LIMIT
      ? chips.value
      : chips.value.slice(0, CATALOG_PICKER_CHIPS_LIMIT),
  );

  /** Сколько чипов спрятано; ноль — спрятанных нет. */
  const hiddenCount = computed(
    () => chips.value.length - visibleChips.value.length,
  );

  const isExpandShown = computed(
    () => chips.value.length > CATALOG_PICKER_CHIPS_LIMIT,
  );

  const expandLabel = computed(() =>
    hiddenCount.value
      ? `${CATALOG_PICKER_TEXT.showMore} ${hiddenCount.value}`
      : CATALOG_PICKER_TEXT.collapse,
  );

  const expandIcon = computed(() =>
    hiddenCount.value
      ? CATALOG_PICKER_ICON.expand
      : CATALOG_PICKER_ICON.collapse,
  );

  const buttonLabel = computed(() => {
    if (model.value.length) {
      return CATALOG_PICKER_TEXT.change;
    }

    return placeholder || CATALOG_PICKER_TEXT.open;
  });

  /**
   * Пустое поле кнопка занимает целиком, а рядом с чипами сжимается до своей
   * короткой подписи.
   */
  const buttonWidthClass = computed(() =>
    chips.value.length ? 'shrink-0' : 'grow',
  );

  /** «Очистить» — когда записей несколько: у одной есть крестик на чипе. */
  const isClearShown = computed(() => model.value.length > 1);

  /**
   * Записывает выбор окна в поле.
   * @param entries - выбранные записи
   */
  function apply(entries: ReadonlyArray<CatalogPickerEntry>): void {
    remember(entries);
    model.value = entries.map((entry) => entry.slug);
  }

  /** Открывает окно выбора; закрытие без «Готово» поле не меняет. */
  async function open(): Promise<void> {
    const modal = overlay.create(WorkshopCatalogPickerModal, {
      props: { section, title, previewType, selected: chips.value },
    });

    const entries = await modal.open().result;

    if (entries) {
      apply(entries);
    }
  }

  /**
   * Убирает запись из выбранного.
   * @param slug - адрес записи
   */
  function remove(slug: string): void {
    apply(chips.value.filter((entry) => entry.slug !== slug));
  }

  function clear(): void {
    apply([]);
  }

  function toggleExpanded(): void {
    isExpanded.value = !isExpanded.value;
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      :icon="CATALOG_PICKER_ICON.open"
      :label="buttonLabel"
      :class="buttonWidthClass"
      color="neutral"
      variant="subtle"
      class="min-w-0 justify-start"
      @click.left.exact.prevent="open"
    />

    <UBadge
      v-for="entry in visibleChips"
      :key="entry.slug"
      color="neutral"
      variant="subtle"
      class="gap-1"
    >
      {{ entry.name }}

      <UButton
        :icon="CATALOG_PICKER_ICON.remove"
        :aria-label="`${CATALOG_PICKER_TEXT.remove}: ${entry.name}`"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="remove(entry.slug)"
      />
    </UBadge>

    <UButton
      v-if="isExpandShown"
      :label="expandLabel"
      :trailing-icon="expandIcon"
      color="neutral"
      variant="subtle"
      size="xs"
      @click.left.exact.prevent="toggleExpanded"
    />

    <UButton
      v-if="isClearShown"
      :icon="CATALOG_PICKER_ICON.remove"
      :aria-label="CATALOG_PICKER_TEXT.clear"
      color="neutral"
      variant="ghost"
      @click.left.exact.prevent="clear"
    />
  </div>
</template>
