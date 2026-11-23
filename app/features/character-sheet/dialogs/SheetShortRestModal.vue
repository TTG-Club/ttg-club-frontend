<script setup lang="ts">
  import type { HitDieRoll } from '../model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    applyMechanicsShortRest,
    createSheetElementId,
    formatModifier,
    getAbilityModifier,
    getDiceFormula,
    getHitDiceTotals,
    getHitPointsToneClass,
    getRestRecoveryLabels,
    HIT_DIE_LABEL_PREFIX,
    REST_ICON,
    REST_TEXT,
    SHEET_ICON,
    SHEET_LABELS,
    SHORT_REST_RULES,
  } from '../model';
  import SheetHitDiceSelect from './SheetHitDiceSelect.vue';
  import SheetRestRules from './SheetRestRules.vue';

  /**
   * Короткий отдых по правилам 2014, как на new.ttg.club: живые хиты,
   * выбор костей хитов к броску (каждая кость катится отдельно со своим
   * модификатором Телосложения), журнал бросков отдыха и что вернётся по
   * окончании. Броски сразу лечат; «Завершить отдых» возвращает ресурсы и
   * ячейки договора и показывает итог.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollFormula } = useSheetRoll();
  const toast = useToast();

  const selected = ref<Record<number, number>>({});
  const rolls = ref<Array<HitDieRoll>>([]);

  watch(isOpen, (open) => {
    if (open) {
      selected.value = {};
      rolls.value = [];
    }
  });

  const health = computed(() => document.value.health);

  const hitPointsClass = computed(() =>
    getHitPointsToneClass(health.value.current, stats.value.hitPointsMax),
  );

  const constitutionModifier = computed(() =>
    getAbilityModifier(stats.value.abilities.CONSTITUTION),
  );

  const formattedConstitution = computed(() =>
    formatModifier(constitutionModifier.value),
  );

  const totals = computed(() => getHitDiceTotals(document.value));

  const isAllSpent = computed(
    () =>
      totals.value.length > 0
      && totals.value.every((total) => total.used >= total.total),
  );

  /** Выбранные кости в пределах остатка. */
  const spending = computed(() =>
    totals.value.flatMap((total) => {
      const count = Math.min(
        selected.value[total.die] ?? 0,
        total.total - total.used,
      );

      return count > 0 ? [{ die: total.die, count }] : [];
    }),
  );

  const selectedCount = computed(() =>
    spending.value.reduce((sum, entry) => sum + entry.count, 0),
  );

  const rollLabel = computed(() =>
    selectedCount.value
      ? `${REST_TEXT.roll} (${selectedCount.value})`
      : REST_TEXT.roll,
  );

  const rollRows = computed(() =>
    rolls.value.map((roll) => ({
      id: roll.id,
      label: `${HIT_DIE_LABEL_PREFIX}${roll.die}: ${roll.rolled} ${formatModifier(roll.modifier)}`,
      restored: `+${roll.restored}`,
    })),
  );

  const restoredTotal = computed(() =>
    rolls.value.reduce((sum, roll) => sum + roll.restored, 0),
  );

  const recoveryLabels = computed(() =>
    getRestRecoveryLabels(document.value, 'short'),
  );

  /**
   * Бросок выбранных костей: каждая кость отдельно, потому что минимум
   * восстановления (ноль) считается на кость, и игрок видит каждый бросок.
   */
  function rollDice(): void {
    const modifier = constitutionModifier.value;

    const results = spending.value.flatMap(({ die, count }) =>
      Array.from({ length: count }, (): HitDieRoll => {
        const total = rollFormula(
          SHEET_LABELS.hitDice,
          getDiceFormula(die, modifier),
          true,
        );

        return {
          id: createSheetElementId(),
          die,
          rolled: total - modifier,
          modifier,
          restored: Math.max(0, total),
        };
      }),
    );

    if (!results.length) {
      return;
    }

    const spent = spending.value;
    const healed = results.reduce((sum, roll) => sum + roll.restored, 0);
    const limit = stats.value.hitPointsMax;

    update((current) => {
      const hitDiceUsed = { ...current.hitDiceUsed };

      for (const { die, count } of spent) {
        hitDiceUsed[String(die)] = (hitDiceUsed[String(die)] ?? 0) + count;
      }

      return {
        ...current,
        hitDiceUsed,
        health: {
          ...current.health,
          current: Math.min(current.health.current + healed, limit),
        },
      };
    });

    rolls.value = [...rolls.value, ...results];
    selected.value = {};
  }

  /**
   * Бросок восстановления зарядов предмета.
   * @param formula - формула восстановления
   */
  function rollRecharge(formula: string): number {
    return rollFormula(REST_TEXT.charges, formula);
  }

  function finish(): void {
    const recovered = recoveryLabels.value;

    const parts = [
      restoredTotal.value
        ? `${REST_TEXT.shortHitPoints}: ${restoredTotal.value}.`
        : REST_TEXT.shortEmpty,
      recovered.length
        ? `${REST_TEXT.recoveredLabel}: ${recovered.join(', ')}.`
        : '',
    ];

    update((current) => applyMechanicsShortRest(current, rollRecharge));

    toast.add({
      title: REST_TEXT.shortFinished,
      description: parts.filter(Boolean).join(' '),
      icon: REST_ICON.short,
      color: 'success',
    });

    isOpen.value = false;
  }

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="REST_TEXT.shortTitle"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-toned">{{ REST_TEXT.shortIntro }}</p>

        <SheetRestRules :rules="SHORT_REST_RULES" />

        <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ REST_TEXT.hitPoints }}
              </span>

              <span class="flex items-end gap-1.5">
                <span
                  class="text-2xl leading-none font-bold tabular-nums"
                  :class="hitPointsClass"
                >
                  {{ health.current }}
                </span>

                <span class="text-sm leading-none text-muted">
                  / {{ stats.hitPointsMax }}
                </span>

                <span
                  v-if="health.temporary > 0"
                  class="text-sm leading-none font-bold text-primary"
                >
                  +{{ health.temporary }}
                </span>
              </span>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span
                class="text-right text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ REST_TEXT.constitution }}
              </span>

              <span
                class="text-2xl leading-none font-bold text-highlighted tabular-nums"
              >
                {{ formattedConstitution }}
              </span>
            </div>
          </div>

          <span class="border-t border-default/50 pt-2 text-[10px] text-dimmed">
            {{ REST_TEXT.constitutionHint }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-baseline justify-between gap-x-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ REST_TEXT.diceTitle }}
            </span>

            <span class="text-xs text-dimmed">{{ REST_TEXT.diceHint }}</span>
          </div>

          <template v-if="totals.length">
            <SheetHitDiceSelect
              v-model="selected"
              :totals="totals"
            />

            <span
              v-if="isAllSpent"
              class="text-xs text-dimmed italic"
            >
              {{ REST_TEXT.spentDice }}
            </span>

            <UButton
              v-else
              :label="rollLabel"
              :icon="SHEET_ICON.dice"
              variant="soft"
              block
              :disabled="!selectedCount"
              @click.left.exact.prevent="rollDice"
            />
          </template>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ REST_TEXT.noDice }}
          </span>
        </div>

        <div
          v-if="rollRows.length"
          class="flex flex-col gap-2"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ REST_TEXT.rollLogTitle }}
          </span>

          <div class="flex flex-col gap-1 rounded-lg bg-elevated/40 p-3">
            <div
              v-for="row in rollRows"
              :key="row.id"
              class="flex items-baseline justify-between gap-2 text-sm"
            >
              <span class="text-muted">{{ row.label }}</span>

              <span class="font-bold text-success">{{ row.restored }}</span>
            </div>

            <div
              class="mt-1 flex items-baseline justify-between gap-2 border-t border-default/50 pt-2 text-sm"
            >
              <span class="font-medium text-toned">
                {{ REST_TEXT.rollTotal }}
              </span>

              <span class="font-bold text-success">+{{ restoredTotal }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="recoveryLabels.length"
          class="flex flex-col gap-2"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ REST_TEXT.recoveryTitle }}
          </span>

          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="label in recoveryLabels"
              :key="label"
              :label="label"
              :icon="REST_ICON.short"
              color="neutral"
              variant="subtle"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="REST_TEXT.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="REST_TEXT.finish"
          :icon="REST_ICON.short"
          @click.left.exact.prevent="finish"
        />
      </div>
    </template>
  </UModal>
</template>
