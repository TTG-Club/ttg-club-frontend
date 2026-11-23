<script setup lang="ts">
  import { clamp } from 'es-toolkit';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    getResourceMax,
    RESOURCE_RECOVERY_BADGES,
    SHEET_BODY_LABELS,
    SHEET_TITLE_ACTION_CLASS,
    SHEET_TITLE_ACTION_REVEAL_CLASS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Ресурсы: счётчики со справочника (ци, ярость, очки чародейства) и свои.
   * Максимум формулой считается по текущему листу; значки справа говорят,
   * что возвращает короткий и долгий отдых.
   */
  const emit = defineEmits<{
    edit: [];
  }>();

  const { document, update, editControlClass } = useCharacterSheet();
  const { formulaContext } = useSheetStats();

  const rows = computed(() =>
    document.value.resources.map((resource) => {
      const max = getResourceMax(resource, formulaContext.value);
      const current = clamp(max - resource.used, 0, max);

      return {
        id: resource.id,
        name: resource.name,
        max,
        current,
        badges: RESOURCE_RECOVERY_BADGES[resource.reset],
        isMinusDisabled: current <= 0,
        isPlusDisabled: current >= max,
      };
    }),
  );

  /**
   * Тратит или возвращает заряд ресурса.
   * @param id - ресурс
   * @param delta - −1 потратить, +1 вернуть
   */
  function adjust(id: string, delta: number): void {
    update((current) => ({
      ...current,
      resources: current.resources.map((resource) => {
        if (resource.id !== id) {
          return resource;
        }

        const max = getResourceMax(resource, formulaContext.value);

        return { ...resource, used: clamp(resource.used - delta, 0, max) };
      }),
    }));
  }
</script>

<template>
  <SheetPanel :title="SHEET_BODY_LABELS.resources">
    <template #title-actions>
      <button
        type="button"
        :class="[
          SHEET_TITLE_ACTION_CLASS,
          SHEET_TITLE_ACTION_REVEAL_CLASS,
          editControlClass,
        ]"
        :aria-label="SHEET_BODY_LABELS.settings"
        @click.left.exact.prevent="emit('edit')"
      >
        <UIcon
          name="tabler:settings"
          class="size-3.5"
        />
      </button>
    </template>

    <div class="flex flex-col gap-2">
      <template v-if="rows.length">
        <div
          v-for="row in rows"
          :key="row.id"
          class="flex flex-wrap items-center gap-1.5 rounded bg-default/30 px-2 py-1.5"
        >
          <UTooltip :text="row.name">
            <span
              class="min-w-9 flex-1 cursor-help truncate text-sm font-bold text-highlighted"
            >
              {{ row.name }}
            </span>
          </UTooltip>

          <UButton
            icon="tabler:minus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :disabled="row.isMinusDisabled"
            :aria-label="`${SHEET_BODY_LABELS.spend}: ${row.name}`"
            @click.left.exact.prevent="adjust(row.id, -1)"
          />

          <span class="text-sm text-muted">
            <span class="font-bold text-highlighted">{{ row.current }}</span>
            /{{ row.max }}
          </span>

          <UButton
            icon="tabler:plus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :disabled="row.isPlusDisabled"
            :aria-label="`${SHEET_BODY_LABELS.restore}: ${row.name}`"
            @click.left.exact.prevent="adjust(row.id, 1)"
          />

          <div class="ml-auto flex items-center gap-1.5">
            <UTooltip
              v-for="badge in row.badges"
              :key="badge.rest"
              :text="badge.hint"
            >
              <span class="flex cursor-help items-center gap-0.5 text-muted">
                <UIcon
                  :name="badge.icon"
                  class="size-4 shrink-0"
                />

                <span class="text-[10px] leading-none font-bold">
                  {{ badge.text }}
                </span>
              </span>
            </UTooltip>
          </div>
        </div>
      </template>

      <span
        v-else
        class="pt-1 text-xs text-dimmed italic"
      >
        {{ SHEET_BODY_LABELS.resourcesEmpty }}
      </span>
    </div>
  </SheetPanel>
</template>
