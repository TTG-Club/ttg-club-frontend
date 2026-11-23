<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import {
    useCharacterSheet,
    useSheetSpellcasting,
    useSheetStats,
  } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    formatModifier,
    SPELL_TAB_TEXT,
    SPELLCASTING_TEXT,
  } from '../model';

  /**
   * Заклинательная характеристика класса, как на new.ttg.club: «По классу»
   * или своя, с пересчётом Сл и атаки на лету. Строка персонажа без
   * класса-заклинателя правит общую характеристику листа.
   */
  const { classId } = defineProps<{
    /** Класс листа; null — общая строка персонажа. */
    classId: string | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rows } = useSheetSpellcasting();

  /** Пункт «По классу» (или «Нет» у строки персонажа). */
  const AUTO = 'AUTO';

  const row = computed(
    () => rows.value.find((entry) => entry.classId === classId) ?? null,
  );

  const draft = ref<AbilityKey | null>(null);

  watch(isOpen, (open) => {
    if (open) {
      draft.value = row.value?.isCustom ? row.value.ability : null;
    }
  });

  const autoLabel = computed(() => {
    if (classId === null) {
      return SPELLCASTING_TEXT.none;
    }

    const auto = row.value?.autoAbility;

    return auto
      ? SPELLCASTING_TEXT.autoValue(ABILITY_LABELS[auto].name)
      : SPELLCASTING_TEXT.autoMissing;
  });

  const items = computed(() => [
    { label: autoLabel.value, value: AUTO },
    ...ABILITY_KEYS.map((key) => ({
      label: ABILITY_LABELS[key].name,
      value: key,
    })),
  ]);

  const effectiveAbility = computed(
    () => draft.value ?? row.value?.autoAbility ?? null,
  );

  const numbers = computed(() => {
    const ability = effectiveAbility.value;

    if (!ability) {
      return { saveDc: '—', attack: '—' };
    }

    const values = stats.value.spellcastingByAbility[ability];

    return {
      saveDc: String(values.saveDc),
      attack: formatModifier(values.attack),
    };
  });

  const title = computed(() =>
    row.value && classId !== null
      ? `${SPELLCASTING_TEXT.title}: ${row.value.className}`
      : SPELLCASTING_TEXT.title,
  );

  /**
   * Выбор характеристики.
   * @param value - пункт списка
   */
  function setAbility(value: unknown): void {
    draft.value = ABILITY_KEYS.find((key) => key === value) ?? null;
  }

  function apply(): void {
    const ability = draft.value;

    update((current) =>
      classId === null
        ? { ...current, spellcastingAbility: ability }
        : {
            ...current,
            classes: current.classes.map((sheetClass) =>
              sheetClass.id === classId
                ? { ...sheetClass, spellcastingAbility: ability }
                : sheetClass,
            ),
          },
    );

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="SPELLCASTING_TEXT.hint"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="SPELLCASTING_TEXT.ability">
          <USelect
            :model-value="draft ?? AUTO"
            :items="items"
            class="w-full"
            @update:model-value="setAbility"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-2">
          <div
            class="flex flex-col gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELL_TAB_TEXT.saveDc.full }}
            </span>

            <span class="text-2xl leading-none font-bold text-highlighted">
              {{ numbers.saveDc }}
            </span>
          </div>

          <div
            class="flex flex-col gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPELL_TAB_TEXT.attack.full }}
            </span>

            <span class="text-2xl leading-none font-bold text-highlighted">
              {{ numbers.attack }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SPELLCASTING_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SPELLCASTING_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
