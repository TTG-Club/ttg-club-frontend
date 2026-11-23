<script setup lang="ts">
  import type { AbilityKey, CustomBonus } from '../model';

  import { clamp, omit } from 'es-toolkit';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_BONUS_KINDS,
    ABILITY_LABELS,
    ABILITY_SCORE,
    ABILITY_SETTINGS_TEXT,
    describeAbilityScore,
    formatModifier,
    getAbilityBonusContext,
    getAbilityModifier,
    getCustomBonusesTotal,
    getCustomBonusParts,
    SHEET_LABELS,
  } from '../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /**
   * Настройка характеристики, как на new.ttg.club: записанное значение,
   * модификатор, разбор итога и свои бонусы к значению (пояс силы, том
   * знаний). Правки копятся в черновике и уходят в лист по «Сохранить»;
   * итоги пересчитываются сразу.
   */
  const { ability } = defineProps<{
    ability: AbilityKey | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const draftScore = ref<number>(ABILITY_SCORE.default);
  const draftBonuses = ref<Array<CustomBonus>>([]);

  // Черновик снимается с листа при каждом открытии; бонусы копируются, иначе
  // правки уходили бы в лист мимо «Сохранить»
  watch(isOpen, (opened) => {
    if (!opened || !ability) {
      return;
    }

    draftScore.value = document.value.abilities[ability];

    draftBonuses.value = (document.value.abilityBonuses[ability] ?? []).map(
      (bonus) => ({ ...bonus }),
    );
  });

  const title = computed(() =>
    ability ? ABILITY_LABELS[ability].name : SHEET_LABELS.abilities,
  );

  const bonusContext = computed(() => getAbilityBonusContext(document.value));

  /**
   * Итог по черновику. Итог листа уже включает эффекты: в нём подменяется
   * только записанная часть (значение и свои бонусы) на черновую.
   */
  const total = computed(() => {
    if (!ability) {
      return draftScore.value;
    }

    const saved =
      document.value.abilities[ability]
      + getCustomBonusesTotal(
        document.value.abilityBonuses[ability] ?? [],
        bonusContext.value,
      );

    const draft =
      (Number.isFinite(draftScore.value) ? draftScore.value : 0)
      + getCustomBonusesTotal(draftBonuses.value, bonusContext.value);

    return clamp(
      stats.value.abilities[ability] - saved + draft,
      ABILITY_SCORE.min,
      ABILITY_SCORE.max,
    );
  });

  const formattedModifier = computed(() =>
    formatModifier(getAbilityModifier(total.value)),
  );

  // Разбор нужен, только когда итог разошёлся с записанным значением: иначе
  // он повторял бы поле ввода
  const totalHint = computed(() => {
    const hint = describeAbilityScore(
      draftScore.value,
      total.value,
      getCustomBonusParts(
        draftBonuses.value,
        bonusContext.value,
        document.value.classes,
      ),
      formatModifier,
    );

    return hint
      ? `${ABILITY_SETTINGS_TEXT.totalTitle} ${total.value} · ${hint}`
      : '';
  });

  function save(): void {
    if (!ability) {
      return;
    }

    const key = ability;

    const score = clamp(
      Number.isFinite(draftScore.value)
        ? Math.trunc(draftScore.value)
        : ABILITY_SCORE.default,
      ABILITY_SCORE.min,
      ABILITY_SCORE.max,
    );

    const bonuses = draftBonuses.value.map((bonus) => ({
      ...bonus,
      value: Number.isFinite(bonus.value) ? Math.trunc(bonus.value) : 0,
    }));

    update((current) => {
      const otherBonuses = omit(current.abilityBonuses, [key]);

      return {
        ...current,
        abilities: { ...current.abilities, [key]: score },
        abilityBonuses: bonuses.length
          ? { ...otherBonuses, [key]: bonuses }
          : otherBonuses,
      };
    });

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
    :description="ABILITY_SETTINGS_TEXT.description"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-6">
          <UFormField :label="ABILITY_SETTINGS_TEXT.scoreTitle">
            <UInputNumber
              v-model="draftScore"
              :min="ABILITY_SCORE.min"
              :max="ABILITY_SCORE.max"
              class="w-40"
            />
          </UFormField>

          <div class="flex flex-col items-center gap-1">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ ABILITY_SETTINGS_TEXT.modifierTitle }}
            </span>

            <span class="text-3xl leading-none font-bold text-highlighted">
              {{ formattedModifier }}
            </span>
          </div>
        </div>

        <!-- Разбор итога: без него не понять, почему модификатор не сходится
          с полем значения -->
        <span
          v-if="totalHint"
          class="text-xs text-dimmed"
        >
          {{ totalHint }}
        </span>

        <USeparator />

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ ABILITY_SETTINGS_TEXT.bonusesTitle }}
          </span>

          <SheetCustomBonusRows
            v-model="draftBonuses"
            :classes="document.classes"
            :context="bonusContext"
            :kinds="ABILITY_BONUS_KINDS"
          />

          <p class="text-xs text-dimmed">
            {{ ABILITY_SETTINGS_TEXT.bonusesHint }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ABILITY_SETTINGS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="ABILITY_SETTINGS_TEXT.save"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
