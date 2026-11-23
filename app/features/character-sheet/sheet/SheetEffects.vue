<script setup lang="ts">
  import type { ActiveEffect } from '~active-effects/model';

  import {
    describeActiveEffect,
    EFFECT_CONDITION_TEMPLATES,
  } from '~active-effects/model';

  import {
    useCharacterSheet,
    useRemoveConfirm,
    useSheetActiveEffects,
  } from '../composables';
  import { SheetConfirmModal, SheetEffectModal } from '../dialogs';
  import {
    EFFECT_FILTER_KEYS,
    EFFECTS_TAB_TEXT,
    SHEET_ICON,
    SHEET_ROW_ACTIONS_CLASS,
    SPELL_FILTER_CHIP_CLASS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Вид источника эффекта для отбора. */
  type EffectFilterKey = (typeof EFFECT_FILTER_KEYS)[number];

  /** Строка общего списка эффектов. */
  interface EffectRow {
    key: string;
    filter: EffectFilterKey;
    effect: ActiveEffect;
    source: string;
    isDisabled: boolean;
    canToggle: boolean;
    canEdit: boolean;
    canRemove: boolean;
    toggle: () => void;
  }

  /** Значок эффекта без своего. */
  const FALLBACK_ICON = 'tabler:sparkles';

  /**
   * Эффекты, как на new.ttg.club: общий список — наложенные состояния и
   * свои эффекты, затем эффекты умений и черт, затем снаряжения — с чипами
   * отбора по источнику. В строке значок, название, источник и описание
   * (своё или собранное из изменений), переключатель; свои эффекты правятся
   * и убираются. Ниже — плитки состояний PHB 2014: клик накладывает и
   * снимает. Истощение — в своей панели слева.
   */
  const { editControlClass, ensureEditable } = useCharacterSheet();

  const {
    isOpen: isRemoveOpen,
    title: removeTitle,
    description: removeDescription,
    ask: askRemove,
    confirm: confirmRemove,
  } = useRemoveConfirm();

  const {
    appliedEffects,
    activeConditionKeys,
    featureEffects,
    equipmentEffects,
    createEffect,
    saveEffect,
    removeEffect,
    toggleEffectDisabled,
    toggleFeatureEffect,
    toggleCondition,
  } = useSheetActiveEffects();

  const editedEffect = ref<ActiveEffect | null>(null);
  const isEditOpen = ref(false);
  const pickedFilters = ref<Array<EffectFilterKey>>([]);

  const rows = computed<Array<EffectRow>>(() => [
    ...appliedEffects.value.map((effect) => ({
      key: `own:${effect.id}`,
      filter: 'applied' as const,
      effect,
      source: effect.conditionKey
        ? EFFECTS_TAB_TEXT.condition
        : EFFECTS_TAB_TEXT.own,
      isDisabled: effect.disabled,
      canToggle: true,
      canEdit: !effect.conditionKey,
      canRemove: true,
      toggle: () => toggleEffectDisabled(effect.id),
    })),
    ...featureEffects.value.map((entry) => ({
      key: `feature:${entry.sourceId}:${entry.effect.id}`,
      filter: 'features' as const,
      effect: entry.effect,
      source: entry.sourceName,
      isDisabled: entry.isDisabled,
      canToggle: true,
      canEdit: false,
      canRemove: false,
      toggle: () => toggleFeatureEffect(entry.sourceId, entry.effect.id),
    })),
    ...equipmentEffects.value.map((entry) => ({
      key: `item:${entry.sourceName}:${entry.effect.id}`,
      filter: 'items' as const,
      effect: entry.effect,
      source: entry.sourceName,
      isDisabled: false,
      canToggle: false,
      canEdit: false,
      canRemove: false,
      toggle: () => undefined,
    })),
  ]);

  const availableFilters = computed(() =>
    EFFECT_FILTER_KEYS.filter((key) =>
      rows.value.some((row) => row.filter === key),
    ),
  );

  const activeFilters = computed(() =>
    pickedFilters.value.filter((key) => availableFilters.value.includes(key)),
  );

  const filterChips = computed(() =>
    availableFilters.value.length > 1
      ? availableFilters.value.map((key) => {
          const isPicked = activeFilters.value.includes(key);

          return {
            key,
            ...EFFECTS_TAB_TEXT.filters[key],
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
    rows.value
      .filter(
        (row) =>
          !activeFilters.value.length
          || activeFilters.value.includes(row.filter),
      )
      .map((row) => ({
        ...row,
        icon: row.effect.icon || FALLBACK_ICON,
        description:
          row.effect.description.trim()
          || describeActiveEffect(row.effect)
          || EFFECTS_TAB_TEXT.noDescription,
        rowClass: row.isDisabled ? 'opacity-50 grayscale' : '',
        toggleLabel: `${row.isDisabled ? EFFECTS_TAB_TEXT.enable : EFFECTS_TAB_TEXT.disable}: ${row.effect.name}`,
      })),
  );

  const emptyLabel = computed(() => {
    if (!rows.value.length) {
      return EFFECTS_TAB_TEXT.empty;
    }

    return visibleRows.value.length ? '' : EFFECTS_TAB_TEXT.emptyFilter;
  });

  const conditions = computed(() =>
    EFFECT_CONDITION_TEMPLATES.map((template) => ({
      template,
      isActive: activeConditionKeys.value.has(template.key),
    })),
  );

  /**
   * Чип источника: повторное нажатие снимает.
   * @param key - источник
   */
  function toggleFilter(key: EffectFilterKey): void {
    pickedFilters.value = pickedFilters.value.includes(key)
      ? pickedFilters.value.filter((entry) => entry !== key)
      : [...pickedFilters.value, key];
  }

  function resetFilters(): void {
    pickedFilters.value = [];
  }

  function addEffect(): void {
    if (!ensureEditable()) {
      return;
    }

    editedEffect.value = createEffect();
    isEditOpen.value = true;
  }

  /**
   * Открывает правку своего эффекта.
   * @param effect - эффект
   */
  function editEffect(effect: ActiveEffect): void {
    if (!ensureEditable()) {
      return;
    }

    editedEffect.value = effect;
    isEditOpen.value = true;
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param effect - эффект
   */
  function askRemoveEffect(effect: ActiveEffect): void {
    if (!ensureEditable()) {
      return;
    }

    askRemove(effect.name, () => removeEffect(effect.id));
  }

  /**
   * Переключатель строки.
   * @param row - строка
   */
  function toggleRow(row: EffectRow): void {
    row.toggle();
  }
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <div class="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      <UTooltip
        v-for="chip in filterChips"
        :key="chip.key"
        :text="chip.hint"
      >
        <button
          type="button"
          :class="chip.chipClass"
          :aria-pressed="chip.isPicked"
          @click.left.exact.prevent="toggleFilter(chip.key)"
        >
          {{ chip.label }}
        </button>
      </UTooltip>

      <UButton
        v-if="activeFilters.length"
        icon="tabler:filter-off"
        :label="EFFECTS_TAB_TEXT.reset"
        color="neutral"
        variant="ghost"
        size="xs"
        @click.left.exact.prevent="resetFilters"
      />

      <UButton
        :label="EFFECTS_TAB_TEXT.add"
        :icon="SHEET_ICON.add"
        color="neutral"
        variant="ghost"
        size="sm"
        class="ml-auto"
        :class="editControlClass"
        @click.left.exact.prevent="addEffect"
      />
    </div>

    <div
      v-for="row in visibleRows"
      :key="row.key"
      class="group flex items-start gap-3 rounded-lg border border-default/50 bg-elevated/20 p-3 transition-colors hover:border-primary/60"
    >
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40 text-primary"
        :class="row.rowClass"
      >
        <UIcon
          :name="row.icon"
          class="size-5"
        />
      </span>

      <div
        class="flex min-w-0 grow flex-col gap-0.5"
        :class="row.rowClass"
      >
        <span class="truncate text-sm font-medium text-highlighted">
          {{ row.effect.name }}
        </span>

        <span class="truncate text-xs text-dimmed">{{ row.source }}</span>

        <span class="text-xs whitespace-pre-line text-toned">
          {{ row.description }}
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <div
          class="flex items-center gap-1"
          :class="SHEET_ROW_ACTIONS_CLASS"
        >
          <UButton
            v-if="row.canEdit"
            :icon="SHEET_ICON.edit"
            :aria-label="`${EFFECTS_TAB_TEXT.edit}: ${row.effect.name}`"
            color="neutral"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="editEffect(row.effect)"
          />

          <UButton
            v-if="row.canRemove"
            :icon="SHEET_ICON.remove"
            :aria-label="`${EFFECTS_TAB_TEXT.remove}: ${row.effect.name}`"
            color="error"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="askRemoveEffect(row.effect)"
          />
        </div>

        <USwitch
          v-if="row.canToggle"
          :model-value="!row.isDisabled"
          :aria-label="row.toggleLabel"
          size="sm"
          @update:model-value="toggleRow(row)"
        />
      </div>
    </div>

    <div
      v-if="emptyLabel"
      class="flex h-32 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ emptyLabel }}
    </div>

    <SheetPanel :title="EFFECTS_TAB_TEXT.conditions">
      <div class="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-3">
        <UTooltip
          v-for="condition in conditions"
          :key="condition.template.key"
          :text="condition.template.description"
        >
          <UButton
            :icon="condition.template.icon"
            :label="condition.template.name"
            :color="condition.isActive ? 'primary' : 'neutral'"
            :variant="condition.isActive ? 'soft' : 'outline'"
            size="md"
            class="justify-start"
            :aria-pressed="condition.isActive"
            @click.left.exact.prevent="toggleCondition(condition.template.key)"
          />
        </UTooltip>
      </div>
    </SheetPanel>

    <SheetEffectModal
      v-model:open="isEditOpen"
      :effect="editedEffect"
      @save="saveEffect"
    />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="removeTitle"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </div>
</template>
