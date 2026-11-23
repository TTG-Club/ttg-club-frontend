<script setup lang="ts">
  import type { ActiveEffect } from '~active-effects/model';

  import { EFFECT_CONDITION_TEMPLATES } from '~active-effects/model';

  import {
    useCharacterSheet,
    useRemoveConfirm,
    useSheetActiveEffects,
  } from '../composables';
  import { SheetConfirmModal, SheetEffectModal } from '../dialogs';
  import { EFFECTS_TEXT, SHEET_GROUP_LABEL_CLASS, SHEET_ICON } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Вкладка эффектов: состояния PHB 2014 плитками (клик накладывает и
   * снимает), свои эффекты (правятся формой эффектов), эффекты умений и черт
   * (выключаются) и надетого снаряжения (только показ). Истощение — в своей
   * панели слева.
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
    customEffects,
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

  const conditions = computed(() =>
    EFFECT_CONDITION_TEMPLATES.map((template) => {
      const isActive = activeConditionKeys.value.has(template.key);

      return {
        template,
        tileClass: isActive
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-default/50 text-muted hover:border-primary/60',
      };
    }),
  );

  const ownRows = computed(() =>
    customEffects.value.map((effect) => ({
      effect,
      toggleIcon: effect.disabled
        ? 'tabler:toggle-left'
        : 'tabler:toggle-right',
      toggleLabel: effect.disabled ? EFFECTS_TEXT.enable : EFFECTS_TEXT.disable,
      nameClass: effect.disabled
        ? 'text-dimmed line-through'
        : 'text-highlighted',
    })),
  );

  const featureRows = computed(() =>
    featureEffects.value.map((entry) => ({
      ...entry,
      toggleIcon: entry.isDisabled
        ? 'tabler:toggle-left'
        : 'tabler:toggle-right',
      toggleLabel: entry.isDisabled
        ? EFFECTS_TEXT.enable
        : EFFECTS_TEXT.disable,
      nameClass: entry.isDisabled
        ? 'text-dimmed line-through'
        : 'text-highlighted',
    })),
  );

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
  function askRemoveEffect(effect: { id: string; name: string }): void {
    askRemove(effect.name, () => removeEffect(effect.id));
  }
</script>

<template>
  <div class="flex flex-col gap-4 pt-2">
    <SheetPanel :title="EFFECTS_TEXT.conditions">
      <div class="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-3">
        <UTooltip
          v-for="condition in conditions"
          :key="condition.template.key"
          :text="condition.template.description"
        >
          <button
            type="button"
            class="flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs font-medium transition-colors"
            :class="condition.tileClass"
            @click.left.exact.prevent="toggleCondition(condition.template.key)"
          >
            <UIcon
              :name="condition.template.icon"
              class="size-4 shrink-0"
            />

            <span class="truncate">{{ condition.template.name }}</span>
          </button>
        </UTooltip>
      </div>
    </SheetPanel>

    <SheetPanel
      :title="EFFECTS_TEXT.own"
      persistent-actions
    >
      <template #title-actions>
        <UButton
          :label="EFFECTS_TEXT.addOwn"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="ghost"
          size="xs"
          :class="editControlClass"
          @click.left.exact.prevent="addEffect"
        />
      </template>

      <ul
        v-if="ownRows.length"
        class="flex flex-col gap-1.5"
      >
        <li
          v-for="row in ownRows"
          :key="row.effect.id"
          class="flex items-center gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
        >
          <UIcon
            :name="row.effect.icon ?? 'tabler:sparkles'"
            class="size-4 shrink-0 text-primary"
          />

          <button
            type="button"
            class="min-w-0 grow truncate text-left text-sm"
            :class="row.nameClass"
            @click.left.exact.prevent="editEffect(row.effect)"
          >
            {{ row.effect.name }}
          </button>

          <UButton
            :icon="row.toggleIcon"
            :aria-label="row.toggleLabel"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="toggleEffectDisabled(row.effect.id)"
          />

          <UButton
            :icon="SHEET_ICON.remove"
            :aria-label="EFFECTS_TEXT.remove"
            color="error"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="askRemoveEffect(row.effect)"
          />
        </li>
      </ul>

      <p
        v-else
        class="text-xs text-dimmed italic"
      >
        {{ EFFECTS_TEXT.emptyOwn }}
      </p>
    </SheetPanel>

    <SheetPanel :title="EFFECTS_TEXT.features">
      <ul
        v-if="featureRows.length"
        class="flex flex-col gap-1.5"
      >
        <li
          v-for="row in featureRows"
          :key="`${row.sourceId}:${row.effect.id}`"
          class="flex items-center gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
        >
          <span class="flex min-w-0 grow flex-col">
            <span
              class="truncate text-sm"
              :class="row.nameClass"
            >
              {{ row.effect.name }}
            </span>

            <span class="truncate text-xs text-dimmed">{{
              row.sourceName
            }}</span>
          </span>

          <UButton
            :icon="row.toggleIcon"
            :aria-label="row.toggleLabel"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="
              toggleFeatureEffect(row.sourceId, row.effect.id)
            "
          />
        </li>
      </ul>

      <p
        v-else
        class="text-xs text-dimmed italic"
      >
        {{ EFFECTS_TEXT.emptyFeatures }}
      </p>
    </SheetPanel>

    <SheetPanel :title="EFFECTS_TEXT.items">
      <ul
        v-if="equipmentEffects.length"
        class="flex flex-col gap-1.5"
      >
        <li
          v-for="entry in equipmentEffects"
          :key="`${entry.sourceName}:${entry.effect.id}`"
          class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
        >
          <span class="text-sm text-highlighted">{{ entry.effect.name }}</span>

          <span :class="SHEET_GROUP_LABEL_CLASS">{{ entry.sourceName }}</span>
        </li>
      </ul>

      <p
        v-else
        class="text-xs text-dimmed italic"
      >
        {{ EFFECTS_TEXT.emptyItems }}
      </p>
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
