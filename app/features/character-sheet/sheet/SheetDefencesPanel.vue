<script setup lang="ts">
  import { useCharacterSheet, useSheetStats } from '../composables';
  import { DEFENCE_LABELS, formatDistance } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Защиты и чувства: сопротивления, иммунитеты и уязвимости к урону,
   * иммунитеты к состояниям (из механики, выборов типа урона и эффектов),
   * чувства и телепатия. Панель видна, только когда есть что показать.
   */
  const { document } = useCharacterSheet();
  const { stats } = useSheetStats();

  const rows = computed(() =>
    [
      {
        key: 'resistances',
        label: DEFENCE_LABELS.resistances,
        values: stats.value.defences.resistances,
      },
      {
        key: 'immunities',
        label: DEFENCE_LABELS.immunities,
        values: stats.value.defences.immunities,
      },
      {
        key: 'vulnerabilities',
        label: DEFENCE_LABELS.vulnerabilities,
        values: stats.value.defences.vulnerabilities,
      },
      {
        key: 'conditions',
        label: DEFENCE_LABELS.conditionImmunities,
        values: stats.value.defences.conditionImmunities,
      },
      {
        key: 'senses',
        label: DEFENCE_LABELS.senses,
        values: [
          ...stats.value.senses.map(
            (sense) =>
              `${sense.label} ${formatDistance(sense.range, document.value.speedUnit)}`,
          ),
          ...(stats.value.telepathy
            ? [
                `${DEFENCE_LABELS.telepathy} ${formatDistance(stats.value.telepathy, document.value.speedUnit)}`,
              ]
            : []),
        ],
      },
    ].filter((row) => row.values.length),
  );
</script>

<template>
  <SheetPanel
    v-if="rows.length"
    :title="DEFENCE_LABELS.title"
  >
    <div class="flex flex-col gap-2 pt-1">
      <div
        v-for="row in rows"
        :key="row.key"
        class="flex flex-col gap-1"
      >
        <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
          {{ row.label }}
        </span>

        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="value in row.values"
            :key="value"
            :label="value"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </div>
      </div>
    </div>
  </SheetPanel>
</template>
