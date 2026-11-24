<script setup lang="ts">
  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    applyDawn,
    applyMechanicsLongRest,
    getHitDiceTotals,
    getLongRestHitDiceRecovery,
    getRestRecoveryLabels,
    HIT_DIE_LABEL_PREFIX,
    LONG_REST_RULES,
    REST_ICON,
    REST_TEXT,
  } from '../model';
  import SheetRestRules from './SheetRestRules.vue';

  /**
   * Долгий отдых по правилам 2014, как на new.ttg.club: что станет с хитами,
   * истощением и костями хитов (стрелкой — значение после отдыха), что ещё
   * вернётся, и предупреждение, если у персонажа 0 хитов. «Завершить отдых»
   * применяет всё разом и показывает итог; «Рассвет» отдельно заряжает
   * предметы.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollFormula } = useSheetRoll();
  const toast = useToast();

  const health = computed(() => document.value.health);

  const isZeroHitPoints = computed(
    () => stats.value.hitPointsMax > 0 && health.value.current <= 0,
  );

  const totals = computed(() => getHitDiceTotals(document.value));

  const recovery = computed(() => getLongRestHitDiceRecovery(totals.value));

  const diceRows = computed(() =>
    totals.value.map((total) => {
      const remaining = total.total - total.used;

      return {
        die: total.die,
        label: `${HIT_DIE_LABEL_PREFIX}${total.die}`,
        remaining,
        total: total.total,
        after: remaining + (recovery.value[total.die] ?? 0),
      };
    }),
  );

  const restoredDice = computed(() =>
    Object.values(recovery.value).reduce((sum, count) => sum + count, 0),
  );

  const diceNote = computed(() =>
    restoredDice.value ? REST_TEXT.longDiceHint : REST_TEXT.longDiceFull,
  );

  const exhaustionAfter = computed(() =>
    Math.max(0, document.value.exhaustion - 1),
  );

  const recoveryLabels = computed(() =>
    getRestRecoveryLabels(document.value, 'long'),
  );

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
      REST_TEXT.longHitPoints,
      restoredDice.value ? `${REST_TEXT.longDice}: ${restoredDice.value}.` : '',
      document.value.exhaustion
        ? `${REST_TEXT.longExhaustion}: ${exhaustionAfter.value}.`
        : '',
      recovered.length
        ? `${REST_TEXT.recoveredLabel}: ${recovered.join(', ')}.`
        : '',
    ];

    const limit = stats.value.hitPointsMax;

    update((current) => applyMechanicsLongRest(current, limit, rollRecharge));

    toast.add({
      title: REST_TEXT.longFinished,
      description: parts.filter(Boolean).join(' '),
      icon: REST_ICON.long,
      color: 'success',
    });

    isOpen.value = false;
  }

  function dawn(): void {
    update((current) => applyDawn(current, rollRecharge));

    toast.add({
      title: REST_TEXT.dawnDone,
      icon: REST_ICON.dawn,
      color: 'success',
    });
  }

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="REST_TEXT.longTitle"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-toned">{{ REST_TEXT.longIntro }}</p>

        <SheetRestRules :rules="LONG_REST_RULES" />

        <UAlert
          v-if="isZeroHitPoints"
          icon="tabler:alert-triangle"
          color="warning"
          variant="subtle"
          :title="REST_TEXT.zeroHitPointsTitle"
          :description="REST_TEXT.zeroHitPointsDescription"
        />

        <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
          <div class="flex items-end justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ REST_TEXT.hitPoints }}
              </span>

              <span class="flex items-end gap-1.5">
                <span
                  class="text-2xl leading-none font-bold text-highlighted tabular-nums"
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

            <span
              class="flex items-center gap-1 text-sm font-bold text-success"
            >
              <UIcon
                name="tabler:arrow-up"
                class="size-4"
              />

              {{ stats.hitPointsMax }}
            </span>
          </div>

          <span class="border-t border-default/50 pt-2 text-[10px] text-dimmed">
            {{ REST_TEXT.hitPointsRecovery }}

            <template v-if="health.temporary > 0">
              {{ REST_TEXT.temporaryNote }}
            </template>
          </span>
        </div>

        <div
          v-if="document.exhaustion"
          class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3"
        >
          <div class="flex items-end justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ REST_TEXT.exhaustionTitle }}
              </span>

              <span
                class="text-2xl leading-none font-bold text-warning tabular-nums"
              >
                {{ document.exhaustion }}
              </span>
            </div>

            <span
              class="flex items-center gap-1 text-sm font-bold text-success"
            >
              <UIcon
                name="tabler:arrow-down"
                class="size-4"
              />

              {{ exhaustionAfter }}
            </span>
          </div>

          <span class="border-t border-default/50 pt-2 text-[10px] text-dimmed">
            {{ REST_TEXT.exhaustionRecovery }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ REST_TEXT.diceTitle }}
          </span>

          <div
            v-if="diceRows.length"
            class="flex flex-col gap-1.5 rounded-lg bg-elevated/40 p-3"
          >
            <div
              v-for="row in diceRows"
              :key="row.die"
              class="flex items-center gap-2"
            >
              <span class="w-10 shrink-0 text-sm font-bold text-highlighted">
                {{ row.label }}
              </span>

              <span class="text-xs text-muted">
                <span class="font-bold text-highlighted">
                  {{ row.remaining }}
                </span>
                / {{ row.total }}
              </span>

              <span
                class="ml-auto flex items-center gap-1 text-sm font-bold text-success"
              >
                <UIcon
                  name="tabler:arrow-up"
                  class="size-4"
                />

                {{ row.after }}
              </span>
            </div>

            <span
              class="border-t border-default/50 pt-2 text-[10px] text-dimmed"
            >
              {{ diceNote }}
            </span>
          </div>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ REST_TEXT.noDice }}
          </span>
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
              :icon="REST_ICON.long"
              color="neutral"
              variant="subtle"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          :label="REST_TEXT.dawn"
          :icon="REST_ICON.dawn"
          color="neutral"
          variant="ghost"
          class="mr-auto"
          @click.left.exact.prevent="dawn"
        />

        <UButton
          :label="REST_TEXT.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="REST_TEXT.finish"
          :icon="REST_ICON.long"
          @click.left.exact.prevent="finish"
        />
      </div>
    </template>
  </UModal>
</template>
