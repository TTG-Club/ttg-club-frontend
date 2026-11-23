<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectFormLayout,
    EffectTrigger,
    EffectTriggerPreset,
  } from '../../model';

  import {
    createEffectTriggerPreset,
    DEFAULT_EFFECT_CHARGES,
    EFFECT_TRIGGER_PRESET_ICONS,
    EFFECT_TRIGGER_PRESET_LABELS,
    EFFECT_TRIGGERS_STEP_LABELS,
    listEffectListTriggers,
    listEffectTriggerPresets,
    listTriggerTags,
    MAX_EFFECT_CHARGES,
    MIN_EFFECT_CHARGES,
    writeEffectTriggerRow,
  } from '../../model';
  import EffectTriggerRow from './EffectTriggerRow.vue';

  /**
   * Шаг «Срабатывания»: урон каждый ход, повторный спасбросок, снятие после
   * атаки и свои срабатывания одним списком. Запись — «сначала старые поля»:
   * то, что выражает старое поле, пишется в него, остальное — в `triggers`.
   */
  const { layout, applierSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
  }>();

  /** Эффект формы: строки списка пишутся в него «сначала старые поля». */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** Срабатывания списка: старые поля эффекта и явные `triggers`. */
  const listedTriggers = computed(() => listEffectListTriggers(effect.value));

  const knownTags = computed(() => listTriggerTags(listedTriggers.value));

  /** Список срабатываний пуст. */
  const isEmpty = computed(() => listedTriggers.value.length === 0);

  /**
   * Строки с ключом для списка: номер и `id` — после записи легаси-строка
   * может сменить `id` и должна перерисоваться.
   */
  const triggerRows = computed(() =>
    listedTriggers.value.map((trigger, index) => ({
      trigger,
      key: `${index}-${trigger.id}`,
    })),
  );

  // Заряды выключены — поля нет вовсе, а не ноль зарядов
  const hasCharges = computed({
    get: () => effect.value.charges !== undefined,
    set: (enabled: boolean) => {
      effect.value = {
        ...effect.value,
        charges: enabled
          ? { max: DEFAULT_EFFECT_CHARGES, current: DEFAULT_EFFECT_CHARGES }
          : undefined,
      };
    },
  });

  // Автор задаёт «сколько всего», а остаток держится равным ему
  const chargesMax = computed({
    get: () => effect.value.charges?.max ?? DEFAULT_EFFECT_CHARGES,
    set: (nextMax: number | null) => {
      const max = Math.max(
        MIN_EFFECT_CHARGES,
        Math.trunc(nextMax ?? DEFAULT_EFFECT_CHARGES),
      );

      effect.value = {
        ...effect.value,
        charges: { ...effect.value.charges, max, current: max },
      };
    },
  });

  const chargesEndsWhenEmpty = computed({
    get: () => effect.value.charges?.endsWhenEmpty === true,
    set: (enabled: boolean) => {
      const { charges } = effect.value;

      if (charges) {
        effect.value = {
          ...effect.value,
          charges: { ...charges, endsWhenEmpty: enabled ? true : undefined },
        };
      }
    },
  });

  const presets = computed(() =>
    listEffectTriggerPresets(layout).map((preset) => ({
      preset,
      label: EFFECT_TRIGGER_PRESET_LABELS[preset],
      icon: EFFECT_TRIGGER_PRESET_ICONS[preset],
    })),
  );

  /**
   * Записывает строку.
   *
   * @param index номер строки.
   * @param trigger новая строка; `null` — убрать.
   */
  function writeTriggerRow(index: number, trigger: EffectTrigger | null): void {
    effect.value = writeEffectTriggerRow(effect.value, index, trigger);
  }

  /**
   * Убирает строку.
   *
   * @param index номер строки.
   */
  function removeTriggerRow(index: number): void {
    writeTriggerRow(index, null);
  }

  /**
   * Добавляет готовое срабатывание в конец списка.
   *
   * @param preset пресет.
   */
  function addPreset(preset: EffectTriggerPreset): void {
    writeTriggerRow(
      listedTriggers.value.length,
      createEffectTriggerPreset(preset, effect.value, layout),
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs text-muted">
      {{ EFFECT_TRIGGERS_STEP_LABELS.hint }}
    </p>

    <p
      v-if="isEmpty"
      class="rounded-md border border-dashed border-default px-3 py-2 text-center text-xs text-dimmed"
    >
      {{ EFFECT_TRIGGERS_STEP_LABELS.empty }}
    </p>

    <EffectTriggerRow
      v-for="(triggerRow, index) in triggerRows"
      :key="triggerRow.key"
      :trigger="triggerRow.trigger"
      :layout="layout"
      :applier-save-dc="applierSaveDc"
      :known-tags="knownTags"
      @update:trigger="writeTriggerRow(index, $event)"
      @remove="removeTriggerRow(index)"
    />

    <template v-if="layout.showCharges">
      <div class="flex flex-wrap items-center gap-2">
        <USwitch
          v-model="hasCharges"
          :label="EFFECT_TRIGGERS_STEP_LABELS.chargesToggle"
        />

        <template v-if="hasCharges">
          <UInputNumber
            v-model="chargesMax"
            :min="MIN_EFFECT_CHARGES"
            :max="MAX_EFFECT_CHARGES"
            size="sm"
            class="w-24"
          />

          <USwitch
            v-model="chargesEndsWhenEmpty"
            :label="EFFECT_TRIGGERS_STEP_LABELS.chargesEndsWhenEmpty"
          />
        </template>
      </div>

      <p
        v-if="hasCharges"
        class="text-xs text-muted"
      >
        {{ EFFECT_TRIGGERS_STEP_LABELS.chargesToggleHint }}
      </p>
    </template>

    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-xs text-muted">
        {{ EFFECT_TRIGGERS_STEP_LABELS.addTitle }}
      </span>

      <UButton
        v-for="presetOption in presets"
        :key="presetOption.preset"
        color="primary"
        variant="soft"
        size="xs"
        :icon="presetOption.icon"
        :label="presetOption.label"
        @click.left.exact.prevent="addPreset(presetOption.preset)"
      />
    </div>
  </div>
</template>
