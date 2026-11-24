<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { ContentDescription } from '~content/model';

  import type {
    CatalogRow,
    FeatureOrigin,
    SheetDocument,
    SheetFeature,
    SheetSource,
  } from '../model';

  import {
    useCharacterSheet,
    useRemoveConfirm,
    useSheetClassData,
    useSheetStats,
  } from '../composables';
  import {
    SheetCatalogAddModal,
    SheetConfirmModal,
    SheetFeatureModal,
    SheetSourceChoices,
    SheetSourceChoicesModal,
  } from '../dialogs';
  import {
    ABILITY_LABELS,
    addSources,
    createSheetElementId,
    FEAT_ADD_TEXT,
    FEAT_CATALOG_SOURCE,
    FEATURE_ORIGIN_LABELS,
    FEATURE_ORIGINS,
    FEATURES_TEXT,
    getClassFeatureSourceUrl,
    getFeatureOriginOrder,
    getPendingChoices,
    getSourceFeatureOrigin,
    loadFeatSource,
    removeSources,
    SHEET_ICON,
    SHEET_TEXT,
    SOURCE_KIND_LABELS,
    SPELL_FILTER_CHIP_CLASS,
    toAbilityKey,
  } from '../model';
  import SheetFeatureRow from './SheetFeatureRow.vue';
  import SheetPanel from './SheetPanel.vue';

  /** Строка общего списка особенностей. */
  interface FeatureRow {
    key: string;
    origin: FeatureOrigin;
    name: string;
    sourceLabel: string;
    choice: string;
    increases: string;
    pending: number;
    url: string | null;
    description: ContentDescription | null;
    /** Источник механики с выборами; null — своя особенность или без них. */
    sourceId: string | null;
    feature: SheetFeature | null;
    canRemove: boolean;
  }

  /**
   * Особенности, как на new.ttg.club: значения таблицы класса, затем один
   * список — раса, умения классов, предыстория, черты и свои особенности —
   * с бейджем источника и чипами отбора. Строка раскрывается: источник,
   * выбор, выборы механики и описание. Свои особенности правятся окном,
   * черты добавляются окном справочника и сразу спрашивают свои выборы.
   */
  const FEATURE_SOURCE_KINDS: ReadonlySet<SheetSource['kind']> = new Set([
    'race',
    'subrace',
    'raceFeature',
    'background',
    'feat',
    'asi',
    'class',
    'subclass',
  ]);

  const { document, update, editControlClass, ensureEditable } =
    useCharacterSheet();

  const {
    isOpen: isRemoveOpen,
    title: removeTitle,
    description: removeDescription,
    ask: askRemove,
    confirm: confirmRemove,
  } = useRemoveConfirm();

  const { features, tableValues, isLoading } = useSheetClassData();
  const { pendingChoices, stats } = useSheetStats();

  const editedFeature = ref<SheetFeature | null>(null);
  const isEditOpen = ref(false);
  const isFeatAddOpen = ref(false);
  const choiceSourceIds = ref<Array<string>>([]);
  const isChoicesOpen = ref(false);
  const pickedOrigins = ref<Array<FeatureOrigin>>([]);

  const visibleTables = computed(() =>
    tableValues.value.filter((table) => table.values.length),
  );

  /** Сколько выборов источника ещё не сделано. */
  const pendingBySource = computed(() =>
    pendingChoices.value.reduce<Record<string, number>>(
      (result, entry) => ({
        ...result,
        [entry.source.id]: (result[entry.source.id] ?? 0) + entry.missing,
      }),
      {},
    ),
  );

  /**
   * Подпись увеличений характеристик источника: «СИЛ +1, ЛОВ +1».
   * @param source - источник
   */
  function getIncreasesLabel(source: SheetSource): string {
    return Object.entries(source.abilityIncreases)
      .flatMap(([key, value]) => {
        const ability = toAbilityKey(key);

        return ability && value
          ? [`${ABILITY_LABELS[ability].short} +${value}`]
          : [];
      })
      .join(', ');
  }

  const classFeatureRows = computed<Array<FeatureRow>>(() =>
    features.value.map((feature) => {
      const [classId = '', featureId = ''] = feature.id.split(':');

      const sheetClass = document.value.classes.find(
        (candidate) => candidate.id === classId,
      );

      const url = getClassFeatureSourceUrl(sheetClass?.url ?? null, featureId);

      const source = document.value.sources.find(
        (candidate) =>
          candidate.kind === 'classFeature'
          && candidate.classId === classId
          && candidate.url === url,
      );

      return {
        key: `class:${feature.id}`,
        origin: 'class',
        name: feature.name,
        sourceLabel: `${feature.className}, ${feature.level} ${SHEET_TEXT.levelShort}`,
        choice: '',
        increases: '',
        pending: source ? (pendingBySource.value[source.id] ?? 0) : 0,
        url: null,
        description: feature.description,
        sourceId: source?.id ?? null,
        feature: null,
        canRemove: false,
      };
    }),
  );

  const sourceRows = computed<Array<FeatureRow>>(() =>
    document.value.sources
      .filter(
        (source) => FEATURE_SOURCE_KINDS.has(source.kind) && !source.parentId,
      )
      .map((source) => ({
        key: `source:${source.id}`,
        origin: getSourceFeatureOrigin(source.kind),
        name: source.name,
        sourceLabel: SOURCE_KIND_LABELS[source.kind],
        choice: '',
        increases: getIncreasesLabel(source),
        pending: pendingBySource.value[source.id] ?? 0,
        url: source.url,
        description: null,
        sourceId: source.id,
        feature: null,
        canRemove: source.kind === 'feat' && !source.classId,
      })),
  );

  const customRows = computed<Array<FeatureRow>>(() =>
    document.value.features.map((feature) => ({
      key: `custom:${feature.id}`,
      origin: feature.origin,
      name: feature.name,
      sourceLabel:
        feature.source || FEATURE_ORIGIN_LABELS[feature.origin].label,
      choice: feature.choice,
      increases: '',
      pending: 0,
      url: null,
      description: feature.description,
      sourceId: null,
      feature,
      canRemove: true,
    })),
  );

  /** Все особенности по группам источников, внутри группы — как пришли. */
  const rows = computed(() =>
    [...sourceRows.value, ...classFeatureRows.value, ...customRows.value]
      .map((row, index) => ({ row, index }))
      .sort(
        (left, right) =>
          getFeatureOriginOrder(left.row.origin)
            - getFeatureOriginOrder(right.row.origin)
          || left.index - right.index,
      )
      .map(({ row }) => row),
  );

  const availableOrigins = computed(() =>
    FEATURE_ORIGINS.filter((origin) =>
      rows.value.some((row) => row.origin === origin),
    ),
  );

  const activeOrigins = computed(() =>
    pickedOrigins.value.filter((origin) =>
      availableOrigins.value.includes(origin),
    ),
  );

  const originChips = computed(() =>
    availableOrigins.value.length > 1
      ? availableOrigins.value.map((origin) => {
          const isPicked = activeOrigins.value.includes(origin);

          return {
            origin,
            ...FEATURE_ORIGIN_LABELS[origin],
            isPicked,
            chipClass: [
              SPELL_FILTER_CHIP_CLASS.base,
              isPicked
                ? SPELL_FILTER_CHIP_CLASS.selected
                : SPELL_FILTER_CHIP_CLASS.idle,
            ],
          };
        })
      : [],
  );

  const visibleRows = computed(() =>
    activeOrigins.value.length
      ? rows.value.filter((row) => activeOrigins.value.includes(row.origin))
      : rows.value,
  );

  const emptyLabel = computed(() => {
    if (!rows.value.length) {
      return FEATURES_TEXT.empty;
    }

    return visibleRows.value.length ? '' : FEATURES_TEXT.emptyFilter;
  });

  const addMenuItems = computed<Array<DropdownMenuItem>>(() => [
    {
      label: FEATURES_TEXT.addFeature,
      icon: SHEET_ICON.edit,
      onSelect: openCreate,
    },
    {
      label: FEATURES_TEXT.addFeat,
      icon: SHEET_ICON.catalog,
      onSelect: openFeatAdd,
    },
  ]);

  const takenFeatUrls = computed(() =>
    document.value.sources.flatMap((source) =>
      source.kind === 'feat' && source.url ? [source.url] : [],
    ),
  );

  /**
   * Чип источника: повторное нажатие снимает.
   * @param origin - источник
   */
  function toggleOrigin(origin: FeatureOrigin): void {
    pickedOrigins.value = pickedOrigins.value.includes(origin)
      ? pickedOrigins.value.filter((entry) => entry !== origin)
      : [...pickedOrigins.value, origin];
  }

  function resetOrigins(): void {
    pickedOrigins.value = [];
  }

  /**
   * Подставляет документ с ответом на выбор.
   * @param next - новый документ
   */
  function applyDocument(next: SheetDocument): void {
    update(() => next);
  }

  function openCreate(): void {
    if (!ensureEditable()) {
      return;
    }

    editedFeature.value = {
      id: createSheetElementId(),
      name: '',
      source: '',
      origin: 'custom',
      choice: '',
      description: [],
    };

    isEditOpen.value = true;
  }

  /**
   * Правка своей особенности.
   * @param feature - особенность
   */
  function openEdit(feature: SheetFeature | null): void {
    if (!feature || !ensureEditable()) {
      return;
    }

    editedFeature.value = feature;
    isEditOpen.value = true;
  }

  /**
   * Сохраняет свою особенность: новая добавляется, прежняя заменяется.
   * @param saved - особенность из окна
   */
  function saveFeature(saved: SheetFeature): void {
    update((current) => ({
      ...current,
      features: current.features.some((feature) => feature.id === saved.id)
        ? current.features.map((feature) =>
            feature.id === saved.id ? saved : feature,
          )
        : [...current.features, saved],
    }));
  }

  function openFeatAdd(): void {
    if (ensureEditable()) {
      isFeatAddOpen.value = true;
    }
  }

  /**
   * Черта справочника с механикой.
   * @param row - строка окна добавления
   */
  function loadFeat(row: CatalogRow): Promise<SheetSource> {
    return loadFeatSource('feat', row.url, {
      characterLevel: stats.value.level,
    });
  }

  /** Вид дровера описания: у окна черт он один. */
  function getFeatPreviewType(): 'feat' {
    return 'feat';
  }

  /**
   * Берёт черты: механика применяется, а несделанные выборы сразу
   * открываются окном выборов.
   * @param feats - загруженные черты
   */
  function addFeats(feats: Array<SheetSource>): void {
    let next: SheetDocument = document.value;

    update((current) => {
      next = addSources(current, feats);

      return next;
    });

    const ids = feats.map((feat) => feat.id);

    const pending = getPendingChoices(next).filter((entry) =>
      ids.includes(entry.source.id),
    );

    if (pending.length) {
      choiceSourceIds.value = [
        ...new Set(pending.map((entry) => entry.source.id)),
      ];

      isChoicesOpen.value = true;
    }
  }

  /**
   * Спрашивает подтверждение удаления: черта снимается со всеми выдачами,
   * своя особенность — просто убирается.
   * @param row - строка
   */
  function askRemoveRow(row: FeatureRow): void {
    if (!ensureEditable()) {
      return;
    }

    const { sourceId, feature } = row;

    askRemove(row.name, () =>
      update((current) => {
        if (feature) {
          return {
            ...current,
            features: current.features.filter(
              (entry) => entry.id !== feature.id,
            ),
          };
        }

        return sourceId ? removeSources(current, [sourceId]) : current;
      }),
    );
  }
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <SheetPanel
      v-if="visibleTables.length"
      :title="FEATURES_TEXT.classTable"
    >
      <div
        v-for="table in visibleTables"
        :key="table.id"
        class="flex flex-col gap-1"
      >
        <span class="text-sm font-semibold text-highlighted">
          {{ table.name }}
        </span>

        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="column in table.values"
            :key="column.name"
            color="neutral"
            variant="subtle"
          >
            {{ column.name }}: {{ column.value }}
          </UBadge>
        </div>
      </div>
    </SheetPanel>

    <div class="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      <UTooltip
        v-for="chip in originChips"
        :key="chip.origin"
        :text="chip.hint"
      >
        <button
          type="button"
          :class="chip.chipClass"
          :aria-pressed="chip.isPicked"
          @click.left.exact.prevent="toggleOrigin(chip.origin)"
        >
          {{ chip.label }}
        </button>
      </UTooltip>

      <UTooltip
        v-if="activeOrigins.length"
        :text="FEATURES_TEXT.resetHint"
      >
        <UButton
          icon="tabler:filter-off"
          :label="FEATURES_TEXT.reset"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="resetOrigins"
        />
      </UTooltip>

      <UIcon
        v-if="isLoading"
        :name="SHEET_ICON.loading"
        :aria-label="FEATURES_TEXT.loading"
        class="size-4 animate-spin text-muted"
      />

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          :label="FEATURES_TEXT.add"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="ghost"
          size="sm"
          class="ml-auto"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <SheetFeatureRow
      v-for="row in visibleRows"
      :key="row.key"
      :name="row.name"
      :origin="row.origin"
      :source-label="row.sourceLabel"
      :choice="row.choice"
      :increases="row.increases"
      :pending="row.pending"
      :url="row.url"
      :description="row.description"
      :can-edit="row.feature !== null"
      :can-remove="row.canRemove"
      @edit="openEdit(row.feature)"
      @remove="askRemoveRow(row)"
    >
      <template
        v-if="row.sourceId"
        #default
      >
        <SheetSourceChoices
          :document="document"
          :source-id="row.sourceId"
          @change="applyDocument"
        />
      </template>
    </SheetFeatureRow>

    <div
      v-if="emptyLabel"
      class="flex h-40 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ emptyLabel }}
    </div>

    <SheetFeatureModal
      v-model:open="isEditOpen"
      :feature="editedFeature"
      @save="saveFeature"
    />

    <SheetCatalogAddModal
      v-model:open="isFeatAddOpen"
      :title="FEAT_ADD_TEXT.title"
      :source="FEAT_CATALOG_SOURCE"
      :taken-urls="takenFeatUrls"
      :taken-label="FEAT_ADD_TEXT.taken"
      :loader="loadFeat"
      :preview-type="getFeatPreviewType"
      @add="addFeats"
    />

    <SheetSourceChoicesModal
      v-model:open="isChoicesOpen"
      :source-ids="choiceSourceIds"
    />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="removeTitle"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </div>
</template>
