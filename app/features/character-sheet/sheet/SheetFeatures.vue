<script setup lang="ts">
  import type { ResourceReset, SheetFeature, SheetResource } from '../model';

  import { ContentRender } from '~content/render';

  import { useCharacterSheet, useSheetClassData } from '../composables';
  import {
    createSheetElementId,
    RESOURCE_RESET_LABELS,
    RESOURCE_RESETS,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_TEXT,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Умения: значения таблицы класса, умения классов и подклассов из
   * справочника к текущему уровню, ресурсы с восстановлением на отдыхе и свои
   * умения и черты.
   */
  const { document, update } = useCharacterSheet();
  const { features, tableValues, isLoading } = useSheetClassData();

  const resetOptions = RESOURCE_RESETS.map((reset) => ({
    label: RESOURCE_RESET_LABELS[reset],
    value: reset,
  }));

  const visibleTables = computed(() =>
    tableValues.value.filter((table) => table.values.length),
  );

  /**
   * Подпись умения: уровень и класс.
   * @param level - уровень получения
   * @param className - класс или подкласс
   */
  function getFeatureCaption(level: number, className: string): string {
    return `${level} ${SHEET_TEXT.levelShort} · ${className}`;
  }

  /**
   * Меняет ресурс.
   * @param id - идентификатор ресурса
   * @param patch - изменённые поля
   */
  function patchResource(id: string, patch: Partial<SheetResource>): void {
    update((current) => ({
      ...current,
      resources: current.resources.map((resource) =>
        resource.id === id ? { ...resource, ...patch } : resource,
      ),
    }));
  }

  function addResource(): void {
    update((current) => ({
      ...current,
      resources: [
        ...current.resources,
        {
          id: createSheetElementId(),
          name: SHEET_LABELS.resource,
          max: 1,
          used: 0,
          reset: 'LONG',
        },
      ],
    }));
  }

  /**
   * Убирает ресурс.
   * @param id - идентификатор ресурса
   */
  function removeResource(id: string): void {
    update((current) => ({
      ...current,
      resources: current.resources.filter((resource) => resource.id !== id),
    }));
  }

  /**
   * Восстановление ресурса из списка.
   * @param id - идентификатор ресурса
   * @param reset - отдых
   */
  function setResourceReset(id: string, reset: ResourceReset): void {
    patchResource(id, { reset });
  }

  /**
   * Осталось использований ресурса.
   * @param resource - ресурс
   * @param left - осталось
   */
  function setResourceLeft(resource: SheetResource, left: number | null): void {
    patchResource(resource.id, {
      used: Math.max(0, resource.max - Math.min(left ?? 0, resource.max)),
    });
  }

  /**
   * Меняет своё умение.
   * @param id - идентификатор умения
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
   * @param id - идентификатор умения
   */
  function removeFeature(id: string): void {
    update((current) => ({
      ...current,
      features: current.features.filter((feature) => feature.id !== id),
    }));
  }
</script>

<template>
  <div class="flex flex-col gap-4">
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

    <SheetPanel :title="SHEET_LABELS.resources">
      <template #actions>
        <UButton
          :label="SHEET_LABELS.add"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="subtle"
          size="xs"
          @click.left.exact.prevent="addResource"
        />
      </template>

      <ul
        v-if="document.resources.length"
        class="flex flex-col gap-2"
      >
        <li
          v-for="resource in document.resources"
          :key="resource.id"
          class="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2 sm:grid-cols-[1fr_5rem_5rem_11rem_auto]"
        >
          <UFormField :label="SHEET_LABELS.name">
            <UInput
              :model-value="resource.name"
              size="sm"
              class="w-full"
              @update:model-value="
                patchResource(resource.id, { name: String($event) })
              "
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.left">
            <UInputNumber
              :model-value="resource.max - resource.used"
              :min="0"
              :max="resource.max"
              size="sm"
              @update:model-value="setResourceLeft(resource, $event)"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.max">
            <UInputNumber
              :model-value="resource.max"
              :min="0"
              size="sm"
              @update:model-value="
                patchResource(resource.id, { max: $event ?? 0 })
              "
            />
          </UFormField>

          <UFormField
            :label="SHEET_LABELS.reset"
            class="hidden sm:block"
          >
            <USelect
              :model-value="resource.reset"
              :items="resetOptions"
              size="sm"
              class="w-full"
              @update:model-value="setResourceReset(resource.id, $event)"
            />
          </UFormField>

          <UButton
            :icon="SHEET_ICON.remove"
            :aria-label="SHEET_LABELS.remove"
            color="error"
            variant="ghost"
            size="sm"
            @click.left.exact.prevent="removeResource(resource.id)"
          />
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ SHEET_LABELS.emptyResources }}
      </p>
    </SheetPanel>

    <SheetPanel :title="SHEET_LABELS.classFeatures">
      <template #actions>
        <UIcon
          v-if="isLoading"
          :name="SHEET_ICON.loading"
          class="size-4 animate-spin text-muted"
        />
      </template>

      <div
        v-if="features.length"
        class="flex flex-col gap-1"
      >
        <UCollapsible
          v-for="feature in features"
          :key="feature.id"
          class="rounded-lg border border-default"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
          >
            <span class="text-highlighted">{{ feature.name }}</span>

            <span class="shrink-0 text-xs text-muted">
              {{ getFeatureCaption(feature.level, feature.className) }}
            </span>
          </button>

          <template #content>
            <div class="px-3 pb-3 text-sm">
              <ContentRender :content="feature.description" />
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

    <SheetPanel :title="SHEET_LABELS.customFeatures">
      <template #actions>
        <UButton
          :label="SHEET_LABELS.add"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="subtle"
          size="xs"
          @click.left.exact.prevent="addFeature"
        />
      </template>

      <div
        v-for="feature in document.features"
        :key="feature.id"
        class="flex flex-col gap-2 rounded-lg border border-default p-3"
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
  </div>
</template>
