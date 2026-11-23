<script setup lang="ts">
  import type { HitDiceTotal } from '../model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    applyDawn,
    applyMechanicsLongRest,
    applyMechanicsShortRest,
    getAbilityModifier,
    getDiceFormula,
    getHitDiceTotals,
    RECHARGE_EVENTS,
    REST_TEXT,
    SHEET_BODY_LABELS,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';

  /**
   * Отдых по правилам 2014. Короткий: траты костей хитов с броском и
   * Телосложением, ресурсы короткого отдыха, ячейки договора, заряды
   * предметов. Долгий: все хиты, половина костей хитов, все ячейки и ресурсы,
   * заряды предметов на рассвете и минус ступень истощения.
   */
  const { mode } = defineProps<{
    mode: 'short' | 'long';
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollFormula } = useSheetRoll();

  const title = computed(() =>
    mode === 'short' ? REST_TEXT.shortTitle : REST_TEXT.longTitle,
  );

  const hitDice = computed(() => getHitDiceTotals(document.value));

  const restores = computed(() => {
    const events: ReadonlyArray<string> =
      mode === 'short'
        ? [RECHARGE_EVENTS.short]
        : [RECHARGE_EVENTS.short, RECHARGE_EVENTS.long, RECHARGE_EVENTS.dawn];

    const resources = document.value.resources
      .filter(
        (resource) =>
          resource.used > 0 && (mode === 'long' || resource.reset !== 'LONG'),
      )
      .map((resource) => resource.name);

    const items = document.value.inventory
      .filter(
        (item) =>
          item.charges?.used && events.includes(item.charges.rechargeEvent),
      )
      .map((item) => item.name);

    return [
      ...(mode === 'long'
        ? [REST_TEXT.hitPointsFull, REST_TEXT.hitDiceHalf, REST_TEXT.spellSlots]
        : []),
      ...(document.value.pactSlotsUsed ? [REST_TEXT.pactSlots] : []),
      ...(resources.length
        ? [`${REST_TEXT.resources}: ${resources.join(', ')}`]
        : []),
      ...(items.length ? [`${REST_TEXT.charges}: ${items.join(', ')}`] : []),
      ...(mode === 'long' && document.value.exhaustion
        ? [REST_TEXT.exhaustion]
        : []),
    ];
  });

  /**
   * Бросок восстановления зарядов предмета.
   * @param formula - формула восстановления
   */
  function rollRecharge(formula: string): number {
    return rollFormula(REST_TEXT.charges, formula);
  }

  /**
   * Тратит кость хитов: бросок с Телосложением лечит.
   * @param total - кости этого размера
   */
  function spendHitDie(total: HitDiceTotal): void {
    if (total.used >= total.total) {
      return;
    }

    const healed = Math.max(
      0,
      rollFormula(
        SHEET_LABELS.hitDice,
        getDiceFormula(
          total.die,
          getAbilityModifier(stats.value.abilities.CONSTITUTION),
        ),
      ),
    );

    const limit = stats.value.hitPointsMax;

    update((current) => ({
      ...current,
      hitDiceUsed: {
        ...current.hitDiceUsed,
        [String(total.die)]: total.used + 1,
      },
      health: {
        ...current.health,
        current: Math.min(current.health.current + healed, limit),
      },
    }));
  }

  function rest(): void {
    const limit = stats.value.hitPointsMax;

    update((current) =>
      mode === 'short'
        ? applyMechanicsShortRest(current, rollRecharge)
        : applyMechanicsLongRest(current, limit, rollRecharge),
    );

    isOpen.value = false;
  }

  function dawn(): void {
    update((current) => applyDawn(current, rollRecharge));
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <div
        v-if="mode === 'short' && hitDice.length"
        class="flex flex-col gap-1"
      >
        <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
          {{ REST_TEXT.spendHitDice }}
        </span>

        <div
          v-for="total in hitDice"
          :key="total.die"
          class="flex items-center gap-2"
        >
          <span class="w-12 font-semibold text-highlighted"
            >к{{ total.die }}</span
          >

          <span class="flex-1 text-sm tabular-nums">
            {{ total.total - total.used }} / {{ total.total }}
          </span>

          <UButton
            :icon="SHEET_ICON.dice"
            :label="SHEET_LABELS.heal"
            color="neutral"
            variant="subtle"
            size="xs"
            :disabled="total.used >= total.total"
            @click.left.exact.prevent="spendHitDie(total)"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
          {{ REST_TEXT.restores }}
        </span>

        <ul class="flex flex-col gap-1">
          <li
            v-for="line in restores"
            :key="line"
            class="flex gap-1.5 text-sm text-toned"
          >
            <UIcon
              name="tabler:point-filled"
              class="mt-1 size-3 shrink-0 text-primary"
            />

            <span>{{ line }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-between gap-2">
        <UButton
          v-if="mode === 'long'"
          :label="SHEET_BODY_LABELS.dawn"
          icon="tabler:sunrise"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="dawn"
        />

        <UButton
          :label="REST_TEXT.apply"
          class="ml-auto"
          @click.left.exact.prevent="rest"
        />
      </div>
    </template>
  </UModal>
</template>
