<script setup lang="ts">
  import type { EffectDamagePart, EffectDamagePartTarget } from '../../model';

  import {
    ACTIVE_EFFECT_LABELS,
    createEmptyEffectDamagePart,
    DEFAULT_EFFECT_DAMAGE_PART_TARGET,
    EFFECT_DAMAGE_STEP_LABELS,
    EFFECT_DAMAGE_TARGET_OPTIONS,
    EFFECT_DAMAGE_TYPE_TOKEN_OPTIONS,
  } from '../../model';
  import EffectDamageFormulaInput from './EffectDamageFormulaInput.vue';

  /**
   * Части урона эффекта: формула с типом урона токеном `@dmg.*`, цель части и
   * «только если нанесён урон».
   *
   * Лечение отдельным типом не пишется: оно — токен формулы (`10@heal` — хиты,
   * `@heal.temp` — временные хиты), и там, где эффект может лечить (урон
   * каждый ход, действие срабатывания), вкладка лечения открыта.
   */
  const {
    addLabel = EFFECT_DAMAGE_STEP_LABELS.addDamage,
    allowHealing = false,
  } = defineProps<{
    /** Подпись кнопки добавления части. */
    addLabel?: string;
    /** Показать вкладку лечения: часть может лечить токеном `@heal`. */
    allowHealing?: boolean;
  }>();

  const model = defineModel<Array<EffectDamagePart>>({
    default: () => [],
  });

  /** Вкладка лечения скрыта там, где часть лечить не может. */
  const hideHealing = computed(() => !allowHealing);

  /**
   * Части с тем, что показывает форма: цель без поля — выбранная цель, как её
   * и считает VTTG.
   */
  const partRows = computed(() =>
    model.value.map((part) => ({
      formula: part.formula,
      target: part.target ?? DEFAULT_EFFECT_DAMAGE_PART_TARGET,
      requiresDamage: part.requiresDamage ?? false,
    })),
  );

  /** Добавляет пустую часть урона в конец списка. */
  function addPart() {
    model.value = [...model.value, createEmptyEffectDamagePart()];
  }

  /**
   * Убирает часть урона.
   *
   * @param index номер части.
   */
  function removePart(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  /**
   * Меняет поля части урона.
   *
   * @param index номер части.
   * @param patch изменённые поля.
   */
  function updatePart(index: number, patch: Partial<EffectDamagePart>) {
    model.value = model.value.map((part, position) =>
      position === index ? { ...part, ...patch } : part,
    );
  }

  /**
   * Меняет формулу части.
   *
   * @param index номер части.
   * @param formula новая формула.
   */
  function updateFormula(index: number, formula: string) {
    updatePart(index, { formula });
  }

  /**
   * Меняет цель части.
   *
   * @param index номер части.
   * @param target новая цель.
   */
  function updateTarget(index: number, target: EffectDamagePartTarget) {
    updatePart(index, { target });
  }

  /**
   * Меняет «только если нанесён урон».
   *
   * @param index номер части.
   * @param requiresDamage значение флажка.
   */
  function updateRequiresDamage(
    index: number,
    requiresDamage: boolean | 'indeterminate',
  ) {
    updatePart(index, { requiresDamage: requiresDamage === true });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(partRow, index) in partRows"
      :key="index"
      class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <!-- Модификаторы спрятаны, как в редакторе эффектов VTTG: нагрузка
        эффекта считается без характеристики носителя -->
      <EffectDamageFormulaInput
        :model-value="partRow.formula"
        :damage-type-options="EFFECT_DAMAGE_TYPE_TOKEN_OPTIONS"
        :hide-healing="hideHealing"
        @update:model-value="updateFormula(index, $event)"
      />

      <div class="grid grid-cols-24 items-end gap-2">
        <UFormField
          :label="ACTIVE_EFFECT_LABELS.damagePartTarget"
          class="col-span-full md:col-span-9"
        >
          <USelect
            :model-value="partRow.target"
            :items="EFFECT_DAMAGE_TARGET_OPTIONS"
            class="w-full"
            @update:model-value="updateTarget(index, $event)"
          />
        </UFormField>

        <UFormField class="col-span-full flex items-center md:col-span-12">
          <UCheckbox
            :model-value="partRow.requiresDamage"
            :label="ACTIVE_EFFECT_LABELS.damagePartRequiresDamage"
            @update:model-value="updateRequiresDamage(index, $event)"
          />
        </UFormField>

        <UFormField class="col-span-full flex items-end md:col-span-3">
          <UButton
            icon="tabler:trash"
            color="error"
            variant="soft"
            :aria-label="ACTIVE_EFFECT_LABELS.damagePartRemove"
            @click.left.exact.prevent="removePart(index)"
          />
        </UFormField>
      </div>
    </div>

    <UButton
      icon="tabler:plus"
      size="xs"
      variant="subtle"
      class="self-start"
      @click.left.exact.prevent="addPart"
    >
      {{ addLabel }}
    </UButton>
  </div>
</template>
