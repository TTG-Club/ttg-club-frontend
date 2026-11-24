<script setup lang="ts">
  import type { ActiveEffect, EffectStage } from '../../model';

  import {
    applyEffectStage,
    EFFECT_STAGES_SECTION_ICONS,
    EFFECT_STAGES_SECTION_LABELS,
    MAX_EFFECT_STAGES,
    resolveEffectStageIndex,
  } from '../../model';
  import EffectChanges from './EffectChanges.vue';
  import EffectFlags from './EffectFlags.vue';

  /**
   * Раздел «Ступени»: у эффекта с нарастающей бедой («Проклятие гибельного
   * старения») каждая ступень несёт свои модификаторы и флаги. Переводит на
   * следующую человек — кнопкой на листе VTTG или действием срабатывания.
   *
   * Действующая ступень переписывает строки самого эффекта: правка ступени
   * сразу видна в строках шага, а первая ступень забирает строки, которые у
   * эффекта уже были.
   */
  const { showPriorityField } = defineProps<{
    /** Показывать приоритет у всех модификаторов. */
    showPriorityField: boolean;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const stages = computed<EffectStage[]>(() => effect.value.stages ?? []);

  /** Ступени с заголовками по номерам: «Ступень 1», «Ступень 2». */
  const stageRows = computed(() =>
    stages.value.map((stage, index) => ({
      stage,
      title: `${EFFECT_STAGES_SECTION_LABELS.stagePrefix}${index + 1}`,
    })),
  );

  const canAddStage = computed(() => stages.value.length < MAX_EFFECT_STAGES);

  /**
   * Записывает список ступеней. Пустой список убирает ступени совсем — эффект
   * снова живёт своими строками. Номер действующей приводится к новому списку,
   * а её строки переписывают строки эффекта.
   *
   * @param nextStages новый список ступеней.
   */
  function writeStages(nextStages: EffectStage[]): void {
    if (nextStages.length === 0) {
      effect.value = {
        ...effect.value,
        stages: undefined,
        stageIndex: undefined,
      };

      return;
    }

    effect.value = applyEffectStage({
      ...effect.value,
      stages: nextStages,
      stageIndex: resolveEffectStageIndex({
        stages: nextStages,
        stageIndex: effect.value.stageIndex,
      }),
    });
  }

  /**
   * Заменяет поля одной ступени.
   *
   * @param index номер ступени.
   * @param patch новые поля ступени.
   */
  function updateStage(index: number, patch: Partial<EffectStage>): void {
    writeStages(
      stages.value.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    );
  }

  /**
   * Меняет подпись ступени. Пустая подпись не пишется: без неё ступени не
   * разобрались бы при следующем открытии.
   *
   * @param index номер ступени.
   * @param nextLabel введённая подпись.
   */
  function updateStageLabel(index: number, nextLabel: string): void {
    const label = nextLabel.trim();

    if (label) {
      updateStage(index, { label });
    }
  }

  /** Добавляет ступень: первая забирает строки самого эффекта. */
  function addStage(): void {
    const isFirst = stages.value.length === 0;

    writeStages([
      ...stages.value,
      {
        label: `${EFFECT_STAGES_SECTION_LABELS.stagePrefix}${stages.value.length + 1}`,
        changes: isFirst ? [...effect.value.changes] : [],
        flags: isFirst ? [...effect.value.flags] : [],
      },
    ]);
  }

  /**
   * Убирает ступень.
   *
   * @param index номер ступени.
   */
  function removeStage(index: number): void {
    writeStages(
      stages.value.filter((_stage, stageIndex) => stageIndex !== index),
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="text-sm font-medium">
        {{ EFFECT_STAGES_SECTION_LABELS.title }}
      </span>

      <p class="text-xs text-muted">
        {{ EFFECT_STAGES_SECTION_LABELS.hint }}
      </p>
    </div>

    <div
      v-for="(stageRow, index) in stageRows"
      :key="index"
      class="flex flex-col gap-2 rounded-md border border-default p-2"
    >
      <div class="flex items-end gap-2">
        <UFormField
          :label="stageRow.title"
          class="flex-1"
        >
          <UInput
            :model-value="stageRow.stage.label"
            size="sm"
            class="w-full"
            @update:model-value="updateStageLabel(index, $event)"
          />
        </UFormField>

        <UButton
          color="error"
          variant="ghost"
          size="xs"
          :icon="EFFECT_STAGES_SECTION_ICONS.remove"
          :aria-label="EFFECT_STAGES_SECTION_LABELS.remove"
          :title="EFFECT_STAGES_SECTION_LABELS.remove"
          @click.left.exact.prevent="removeStage(index)"
        />
      </div>

      <EffectChanges
        :model-value="stageRow.stage.changes"
        :show-priority-field="showPriorityField"
        @update:model-value="updateStage(index, { changes: $event })"
      />

      <EffectFlags
        :model-value="stageRow.stage.flags"
        @update:model-value="updateStage(index, { flags: $event })"
      />
    </div>

    <UButton
      v-if="canAddStage"
      color="primary"
      variant="soft"
      size="xs"
      :icon="EFFECT_STAGES_SECTION_ICONS.add"
      class="w-fit"
      :label="EFFECT_STAGES_SECTION_LABELS.add"
      @click.left.exact.prevent="addStage"
    />
  </div>
</template>
