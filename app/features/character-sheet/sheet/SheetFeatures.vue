<script setup lang="ts">
  import type {
    CatalogOption,
    SheetDocument,
    SheetFeature,
    SheetSource,
  } from '../model';

  import { ContentRender } from '~content/render';
  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useSheetClassData,
    useSheetStats,
  } from '../composables';
  import { SheetCatalogPicker, SheetSourceChoices } from '../dialogs';
  import {
    ABILITY_LABELS,
    addSources,
    createSheetElementId,
    FEAT_SEARCH,
    getClassFeatureSourceUrl,
    loadFeatSource,
    removeSources,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_TEXT,
    SOURCE_KIND_LABELS,
    toAbilityKey,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Особенности: значения таблицы класса, умения классов и подклассов к
   * текущему уровню (с выборами умения, если у него есть механика), раса,
   * предыстория, черты и увеличения характеристик с их выборами, свои умения.
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

  const toast = useToast();
  const { document, update, editControlClass } = useCharacterSheet();
  const { features, tableValues, isLoading } = useSheetClassData();
  const { pendingChoices, stats } = useSheetStats();

  const isFeatPickerOpen = ref(false);

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

  const classFeatureRows = computed(() =>
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
        feature,
        sourceId: source?.id ?? null,
        pending: source ? (pendingBySource.value[source.id] ?? 0) : 0,
        caption: `${feature.level} ${SHEET_TEXT.levelShort} · ${feature.className}`,
      };
    }),
  );

  /**
   * Подпись прибавок к характеристикам источника: «Сила +1, Ловкость +1».
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

  const sourceRows = computed(() =>
    document.value.sources
      .filter(
        (source) => FEATURE_SOURCE_KINDS.has(source.kind) && !source.parentId,
      )
      .map((source) => ({
        source,
        kindLabel: SOURCE_KIND_LABELS[source.kind],
        increases: getIncreasesLabel(source),
        pending: pendingBySource.value[source.id] ?? 0,
        canRemove: source.kind === 'feat' && !source.classId,
      })),
  );

  /**
   * Подставляет документ с ответом на выбор.
   * @param next - новый документ
   */
  function applyDocument(next: SheetDocument): void {
    update(() => next);
  }

  /**
   * Берёт черту из справочника: её механика применяется, выборы — здесь же.
   * @param option - выбранная черта
   */
  async function addFeat(option: CatalogOption): Promise<void> {
    try {
      const feat = await loadFeatSource('feat', option.url, {
        characterLevel: stats.value.level,
      });

      update((current) => addSources(current, [feat]));
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  /**
   * Снимает черту со всеми выдачами.
   * @param id - источник черты
   */
  function removeFeat(id: string): void {
    update((current) => removeSources(current, [id]));
  }

  /**
   * Меняет своё умение.
   * @param id - умение
   * @param patch - изменённые поля
   */
  function patchFeature(id: string, patch: Partial<SheetFeature>): void {
    update((current) => ({
      ...current,
      features: current.features.map((feature) =>
        feature.id === id ? { ...feature, ...patch } : feature,
      ),
    }));
  }

  function addFeature(): void {
    update((current) => ({
      ...current,
      features: [
        ...current.features,
        {
          id: createSheetElementId(),
          name: SHEET_LABELS.feature,
          source: '',
          description: '',
        },
      ],
    }));
  }

  /**
   * Убирает своё умение.
   * @param id - умение
   */
  function removeFeature(id: string): void {
    update((current) => ({
      ...current,
      features: current.features.filter((feature) => feature.id !== id),
    }));
  }

  function openFeatPicker(): void {
    isFeatPickerOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4 pt-2">
    <SheetPanel
      v-if="visibleTables.length"
      :title="SHEET_LABELS.classTable"
    >
      <div
        v-for="table in visibleTables"
        :key="table.id"
        class="flex flex-col gap-1"
      >
        <span class="text-sm font-semibold text-highlighted">{{
          table.name
        }}</span>

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

    <SheetPanel
      :title="SHEET_LABELS.classFeatures"
      persistent-actions
    >
      <template #title-actions>
        <UIcon
          v-if="isLoading"
          :name="SHEET_ICON.loading"
          class="size-4 animate-spin text-muted"
        />
      </template>

      <div
        v-if="classFeatureRows.length"
        class="flex flex-col gap-1"
      >
        <UCollapsible
          v-for="row in classFeatureRows"
          :key="row.feature.id"
          class="rounded-lg border border-default/50 bg-elevated/20"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
          >
            <span class="flex items-center gap-2 text-highlighted">
              {{ row.feature.name }}

              <UBadge
                v-if="row.pending"
                :label="String(row.pending)"
                color="warning"
                variant="subtle"
                size="sm"
              />
            </span>

            <span class="shrink-0 text-xs text-muted">{{ row.caption }}</span>
          </button>

          <template #content>
            <div class="flex flex-col gap-3 px-3 pb-3 text-sm">
              <SheetSourceChoices
                v-if="row.sourceId"
                :document="document"
                :source-id="row.sourceId"
                @change="applyDocument"
              />

              <ContentRender :content="row.feature.description" />
            </div>
          </template>
        </UCollapsible>
      </div>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ SHEET_LABELS.emptyFeatures }}
      </p>
    </SheetPanel>

    <SheetPanel
      :title="SOURCE_KIND_LABELS.feat"
      persistent-actions
    >
      <template #title-actions>
        <UButton
          :label="SHEET_LABELS.add"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="ghost"
          size="xs"
          :class="editControlClass"
          @click.left.exact.prevent="openFeatPicker"
        />
      </template>

      <div
        v-for="row in sourceRows"
        :key="row.source.id"
        class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-if="row.source.url"
            :to="row.source.url"
            target="_blank"
            class="text-sm font-medium text-highlighted hover:text-primary"
          >
            {{ row.source.name }}
          </NuxtLink>

          <span
            v-else
            class="text-sm font-medium text-highlighted"
          >
            {{ row.source.name }}
          </span>

          <UBadge
            :label="row.kindLabel"
            color="neutral"
            variant="subtle"
            size="sm"
          />

          <UBadge
            v-if="row.increases"
            :label="row.increases"
            color="primary"
            variant="subtle"
            size="sm"
          />

          <UBadge
            v-if="row.pending"
            :label="String(row.pending)"
            color="warning"
            variant="subtle"
            size="sm"
          />

          <UButton
            v-if="row.canRemove"
            :icon="SHEET_ICON.remove"
            :aria-label="SHEET_LABELS.remove"
            color="error"
            variant="ghost"
            size="xs"
            class="ml-auto"
            :class="editControlClass"
            @click.left.exact.prevent="removeFeat(row.source.id)"
          />
        </div>

        <SheetSourceChoices
          :document="document"
          :source-id="row.source.id"
          @change="applyDocument"
        />
      </div>
    </SheetPanel>

    <SheetPanel
      :title="SHEET_LABELS.customFeatures"
      persistent-actions
    >
      <template #title-actions>
        <UButton
          :label="SHEET_LABELS.add"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="ghost"
          size="xs"
          :class="editControlClass"
          @click.left.exact.prevent="addFeature"
        />
      </template>

      <div
        v-for="feature in document.features"
        :key="feature.id"
        class="flex flex-col gap-2 rounded-lg border border-default/50 p-3"
      >
        <div class="flex items-center gap-2">
          <UInput
            :model-value="feature.name"
            :placeholder="SHEET_LABELS.name"
            size="sm"
            class="min-w-0 flex-1"
            @update:model-value="
              patchFeature(feature.id, { name: String($event) })
            "
          />

          <UInput
            :model-value="feature.source"
            :placeholder="SHEET_LABELS.source"
            size="sm"
            class="w-32"
            @update:model-value="
              patchFeature(feature.id, { source: String($event) })
            "
          />

          <UButton
            :icon="SHEET_ICON.remove"
            :aria-label="SHEET_LABELS.remove"
            color="error"
            variant="ghost"
            size="sm"
            @click.left.exact.prevent="removeFeature(feature.id)"
          />
        </div>

        <UTextarea
          :model-value="feature.description"
          :placeholder="SHEET_LABELS.description"
          :rows="2"
          autoresize
          class="w-full"
          @update:model-value="
            patchFeature(feature.id, { description: String($event) })
          "
        />
      </div>
    </SheetPanel>

    <SheetCatalogPicker
      v-model:open="isFeatPickerOpen"
      :title="SOURCE_KIND_LABELS.feat"
      :source="FEAT_SEARCH"
      @pick="addFeat"
    />
  </div>
</template>
