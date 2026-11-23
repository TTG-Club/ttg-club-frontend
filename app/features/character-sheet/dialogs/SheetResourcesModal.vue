<script setup lang="ts">
  import type { ResourceReset, SheetResource } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    createSheetElementId,
    getResourceMax,
    RESOURCE_RESET_LABELS,
    RESOURCE_RESETS,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';

  /**
   * Настройка ресурсов: свои ресурсы заводятся и правятся целиком, у
   * ресурсов справочника максимум считается формулой, правится только
   * название и восстановление.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { formulaContext } = useSheetStats();

  const resetOptions = RESOURCE_RESETS.map((reset) => ({
    label: RESOURCE_RESET_LABELS[reset],
    value: reset,
  }));

  const rows = computed(() =>
    document.value.resources.map((resource) => ({
      resource,
      max: getResourceMax(resource, formulaContext.value),
      isCatalog: Boolean(resource.formula || resource.scaling.length),
    })),
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
          class="grid grid-cols-[1fr_5rem_auto] items-end gap-2 sm:grid-cols-[1fr_5rem_12rem_auto]"
        >
          <UFormField :label="SHEET_LABELS.name">
            <UInput
              :model-value="row.resource.name"
              size="sm"
              class="w-full"
              @update:model-value="setName(row.resource.id, $event)"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.max">
            <UInputNumber
              :model-value="row.max"
              :min="0"
              :disabled="row.isCatalog"
              size="sm"
              @update:model-value="setMax(row.resource.id, $event)"
            />
          </UFormField>

          <UFormField
            :label="SHEET_LABELS.reset"
            class="hidden sm:block"
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
