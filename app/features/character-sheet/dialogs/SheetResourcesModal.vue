<script setup lang="ts">
  import type {
    AbilityKey,
    ResourceMaxRule,
    ResourceMaxSource,
    ResourceReset,
    SheetResource,
  } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    createSheetElementId,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    getResourceMax,
    getResourceMaxFormula,
    getResourceMaxRule,
    RESOURCE_MAX_OFFSET_RANGE,
    RESOURCE_MAX_SOURCE_LABELS,
    RESOURCE_MAX_SOURCES,
    RESOURCE_MAX_TEXT,
    RESOURCE_RESET_LABELS,
    RESOURCE_RESETS,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';

  /**
   * Настройка ресурсов: свои ресурсы заводятся и правятся целиком, максимум
   * — своим числом или от растущего значения листа (бонус мастерства,
   * модификатор, уровень) с прибавкой и нижней границей. У ресурсов
   * справочника максимум считается сам, правится только название и
   * восстановление.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { formulaContext } = useSheetStats();

  const resetOptions = RESOURCE_RESETS.map((reset) => ({
    label: RESOURCE_RESET_LABELS[reset],
    value: reset,
  }));

  const sourceOptions = RESOURCE_MAX_SOURCES.map((source) => ({
    label: RESOURCE_MAX_SOURCE_LABELS[source],
    value: source,
  }));

  const abilityOptions = ABILITY_KEYS.map((key) => ({
    label: ABILITY_LABELS[key].name,
    value: key,
  }));

  const rows = computed(() =>
    document.value.resources.map((resource) => {
      const rule = getResourceMaxRule(resource);

      return {
        resource,
        rule,
        max: getResourceMax(resource, formulaContext.value),
        isCatalog: rule === null,
        isFixed: rule?.source === 'fixed',
        isAbility: rule?.source === 'ability',
        source: rule?.source,
        ability: rule?.ability,
        offset: rule?.offset ?? 0,
      };
    }),
  );

  /**
   * Меняет ресурс.
   * @param id - ресурс
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
          sourceId: null,
          counterKey: null,
          formula: null,
          scaling: [],
          minimum: 0,
          classId: null,
        },
      ],
    }));
  }

  /**
   * Убирает ресурс.
   * @param id - ресурс
   */
  function removeResource(id: string): void {
    update((current) => ({
      ...current,
      resources: current.resources.filter((resource) => resource.id !== id),
    }));
  }

  /**
   * Восстановление ресурса.
   * @param id - ресурс
   * @param reset - правило отдыха
   */
  function setReset(id: string, reset: ResourceReset): void {
    patchResource(id, { reset });
  }

  /**
   * Название ресурса.
   * @param id - ресурс
   * @param name - название
   */
  function setName(id: string, name: string | number): void {
    patchResource(id, { name: String(name) });
  }

  /**
   * Меняет правило максимума своего ресурса; формула собирается заново.
   * @param resource - ресурс
   * @param patch - изменённые поля правила
   */
  function patchRule(
    resource: SheetResource,
    patch: Partial<ResourceMaxRule>,
  ): void {
    const rule = getResourceMaxRule(resource);

    if (!rule) {
      return;
    }

    const next = { ...rule, ...patch };

    patchResource(resource.id, {
      formula: getResourceMaxFormula(next),
      // Своё число стартует с того, что ресурс давал по формуле
      max:
        next.source === 'fixed'
          ? getResourceMax(resource, formulaContext.value)
          : resource.max,
    });
  }

  /**
   * Источник максимума.
   * @param resource - ресурс
   * @param value - выбранный источник
   */
  function setSource(resource: SheetResource, value: unknown): void {
    const source: ResourceMaxSource | undefined = RESOURCE_MAX_SOURCES.find(
      (item) => item === value,
    );

    if (source) {
      patchRule(resource, { source });
    }
  }

  /**
   * Характеристика, чей модификатор идёт в максимум.
   * @param resource - ресурс
   * @param value - выбранная характеристика
   */
  function setAbility(resource: SheetResource, value: unknown): void {
    const ability: AbilityKey | undefined = ABILITY_KEYS.find(
      (key) => key === value,
    );

    if (ability) {
      patchRule(resource, { ability });
    }
  }

  /**
   * Прибавка к источнику максимума.
   * @param resource - ресурс
   * @param value - прибавка
   */
  function setOffset(resource: SheetResource, value: number | null): void {
    patchRule(resource, { offset: Math.trunc(value ?? 0) });
  }

  /**
   * Нижняя граница максимума по формуле.
   * @param id - ресурс
   * @param value - граница
   */
  function setMinimum(id: string, value: number | null): void {
    patchResource(id, { minimum: Math.max(0, Math.trunc(value ?? 0)) });
  }

  /**
   * Максимум своего ресурса.
   * @param id - ресурс
   * @param max - максимум
   */
  function setMax(id: string, max: number | null): void {
    patchResource(id, { max: Math.max(0, max ?? 0) });
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_LABELS.resources"
    :ui="{ content: 'max-w-2xl', body: 'flex flex-col gap-3' }"
  >
    <template #body>
      <ul
        v-if="rows.length"
        class="flex flex-col gap-2"
      >
        <li
          v-for="row in rows"
          :key="row.resource.id"
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-2"
        >
          <div class="flex items-end gap-2">
            <UFormField
              :label="SHEET_LABELS.name"
              class="min-w-0 grow"
            >
              <UInput
                :model-value="row.resource.name"
                size="sm"
                class="w-full"
                @update:model-value="setName(row.resource.id, $event)"
              />
            </UFormField>

            <UFormField
              :label="SHEET_LABELS.reset"
              class="w-44 shrink-0"
            >
              <USelect
                :model-value="row.resource.reset"
                :items="resetOptions"
                size="sm"
                class="w-full"
                @update:model-value="setReset(row.resource.id, $event)"
              />
            </UFormField>

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="SHEET_LABELS.remove"
              color="error"
              variant="ghost"
              size="sm"
              @click.left.exact.prevent="removeResource(row.resource.id)"
            />
          </div>

          <p
            v-if="row.isCatalog"
            class="text-xs text-dimmed"
          >
            {{ RESOURCE_MAX_TEXT.catalogHint }}
            {{ RESOURCE_MAX_TEXT.computed }}: {{ row.max }}
          </p>

          <div
            v-else
            class="flex flex-wrap items-end gap-2"
          >
            <UFormField
              :label="RESOURCE_MAX_TEXT.source"
              class="w-52"
            >
              <USelect
                :model-value="row.source"
                :items="sourceOptions"
                size="sm"
                class="w-full"
                @update:model-value="setSource(row.resource, $event)"
              />
            </UFormField>

            <UFormField
              v-if="row.isFixed"
              :label="SHEET_LABELS.max"
              class="w-28"
            >
              <UInputNumber
                :model-value="row.resource.max"
                :min="0"
                size="sm"
                @update:model-value="setMax(row.resource.id, $event)"
              />
            </UFormField>

            <template v-else>
              <UFormField
                v-if="row.isAbility"
                :label="RESOURCE_MAX_TEXT.ability"
                class="w-40"
              >
                <USelect
                  :model-value="row.ability"
                  :items="abilityOptions"
                  size="sm"
                  class="w-full"
                  @update:model-value="setAbility(row.resource, $event)"
                />
              </UFormField>

              <UFormField
                :label="RESOURCE_MAX_TEXT.offset"
                class="w-28"
              >
                <UInputNumber
                  :model-value="row.offset"
                  :min="RESOURCE_MAX_OFFSET_RANGE.min"
                  :max="RESOURCE_MAX_OFFSET_RANGE.max"
                  :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
                  size="sm"
                  @update:model-value="setOffset(row.resource, $event)"
                />
              </UFormField>

              <UFormField
                :label="RESOURCE_MAX_TEXT.minimum"
                class="w-28"
              >
                <UInputNumber
                  :model-value="row.resource.minimum"
                  :min="0"
                  size="sm"
                  @update:model-value="setMinimum(row.resource.id, $event)"
                />
              </UFormField>

              <span class="pb-1.5 text-sm text-toned">
                {{ RESOURCE_MAX_TEXT.computed }}:
                <span class="font-bold text-highlighted">{{ row.max }}</span>
              </span>
            </template>
          </div>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ SHEET_LABELS.emptyResources }}
      </p>

      <UButton
        :label="SHEET_LABELS.add"
        :icon="SHEET_ICON.add"
        color="neutral"
        variant="subtle"
        class="self-start"
        @click.left.exact.prevent="addResource"
      />
    </template>
  </UModal>
</template>
