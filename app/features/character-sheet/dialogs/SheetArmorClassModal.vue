<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import { range } from 'es-toolkit';

  import { useCharacterSheet } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    ARMOR_CLASS_TEXT,
    ARMOR_DEX_LIMIT_MAX,
    CUSTOM_BONUS_FORMAT_OPTIONS,
    formatModifier,
    getSheetStats,
  } from '../model';

  /** Значение пункта «по правилу доспеха» в списке предела Ловкости. */
  const DEX_LIMIT_RULE = 'rule';

  /**
   * Класс доспеха, как на new.ttg.club: своё значение или расчёт по
   * доспеху, характеристики в КД, предел Ловкости, свой бонус и разбор
   * итога по слагаемым. Правки копятся в черновике и уходят в лист по
   * «Применить»; разбор считается той же функцией, что и лист.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  const isCustom = ref(false);
  const base = ref(0);
  const abilities = ref<Array<AbilityKey>>([]);
  const dexLimit = ref<number | null>(null);
  const ownBonus = ref(0);

  const abilityItems = ABILITY_KEYS.map((key) => ({
    value: key,
    label: ABILITY_LABELS[key].name,
  }));

  const dexLimitItems = [
    { value: DEX_LIMIT_RULE, label: ARMOR_CLASS_TEXT.dexLimitRule },
    ...range(ARMOR_DEX_LIMIT_MAX + 1).map((limit) => ({
      value: String(limit),
      label: formatModifier(limit),
    })),
  ];

  // Черновик снимается с листа при каждом открытии окна
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    const current = document.value;
    const stats = getSheetStats(current);

    isCustom.value = current.armorClassOverride !== null;

    base.value =
      current.armorClassOverride ?? stats.armorClassBreakdown.bodyValue;

    abilities.value = [...current.armorClassAbilities];
    dexLimit.value = current.armorClassDexLimit;
    ownBonus.value = current.armorClassBonus;
  });

  /** Поле числа, очищенное во время правки, считается нулём. */
  function toInteger(value: number): number {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  const draftDocument = computed(() => ({
    ...document.value,
    armorClassOverride: isCustom.value
      ? Math.max(0, toInteger(base.value))
      : null,
    armorClassAbilities: abilities.value,
    armorClassDexLimit: dexLimit.value,
    armorClassBonus: toInteger(ownBonus.value),
  }));

  const breakdown = computed(
    () => getSheetStats(draftDocument.value).armorClassBreakdown,
  );

  const abilitiesHint = computed(() => {
    if (isCustom.value) {
      return abilities.value.length
        ? ARMOR_CLASS_TEXT.abilitiesCustomHint
        : ARMOR_CLASS_TEXT.abilitiesCustomEmptyHint;
    }

    return abilities.value.length
      ? ARMOR_CLASS_TEXT.abilitiesArmorHint
      : ARMOR_CLASS_TEXT.abilitiesArmorEmptyHint;
  });

  // Предел режет только Ловкость от доспеха: без неё и в ручном режиме
  // ограничивать нечего
  const isDexLimitShown = computed(
    () => !isCustom.value && abilities.value.includes('DEXTERITY'),
  );

  const dexLimitValue = computed(() =>
    dexLimit.value === null ? DEX_LIMIT_RULE : String(dexLimit.value),
  );

  /** Строки разбора без нулевых слагаемых. */
  const rows = computed(() => {
    const value = breakdown.value;

    return [
      ...(value.shield
        ? [
            {
              key: 'shield',
              label: ARMOR_CLASS_TEXT.shieldTitle,
              value: value.shield,
            },
          ]
        : []),
      ...value.extraAbilities.map((extra) => ({
        key: extra.ability,
        label: ABILITY_LABELS[extra.ability].name,
        value: extra.modifier,
      })),
      ...(value.ownBonus
        ? [
            {
              key: 'own',
              label: ARMOR_CLASS_TEXT.bonusTitle,
              value: value.ownBonus,
            },
          ]
        : []),
      ...(value.featureBonus
        ? [
            {
              key: 'features',
              label: ARMOR_CLASS_TEXT.featuresTitle,
              value: value.featureBonus,
            },
          ]
        : []),
      ...(value.effectBonus
        ? [
            {
              key: 'effects',
              label: ARMOR_CLASS_TEXT.effectsTitle,
              value: value.effectBonus,
            },
          ]
        : []),
    ].map((row) => ({ ...row, formattedValue: formatModifier(row.value) }));
  });

  const bodyTitle = computed(() =>
    breakdown.value.isCustom
      ? ARMOR_CLASS_TEXT.valueTitle
      : ARMOR_CLASS_TEXT.armorTitle,
  );

  const dexterityHint = computed(() => {
    const dexterity = breakdown.value.dexterity;

    return dexterity?.isCapped
      ? `${ARMOR_CLASS_TEXT.dexCapped}: ${formatModifier(dexterity.value)}`
      : '';
  });

  /**
   * Характеристики из множественного выбора.
   * @param value - выбранные значения
   */
  function setAbilities(value: unknown): void {
    abilities.value = Array.isArray(value)
      ? ABILITY_KEYS.filter((key) => value.includes(key))
      : [];
  }

  /**
   * Предел Ловкости: число — свой предел, иначе — по правилу доспеха.
   * @param value - выбранный пункт
   */
  function setDexLimit(value: unknown): void {
    const limit = Number(value);

    dexLimit.value = Number.isInteger(limit) ? limit : null;
  }

  function apply(): void {
    const next = draftDocument.value;

    update((current) => ({
      ...current,
      armorClassOverride: next.armorClassOverride,
      armorClassAbilities: next.armorClassAbilities,
      armorClassDexLimit: next.armorClassDexLimit,
      armorClassBonus: next.armorClassBonus,
    }));

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ARMOR_CLASS_TEXT.title"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UCheckbox
          v-model="isCustom"
          :label="ARMOR_CLASS_TEXT.customToggle"
          :description="ARMOR_CLASS_TEXT.customToggleHint"
        />

        <USeparator class="my-1" />

        <div
          v-if="isCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_TEXT.valueTitle }}
          </span>

          <UInputNumber
            v-model="base"
            :min="0"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_TEXT.abilitiesTitle }}
          </span>

          <USelectMenu
            :model-value="abilities"
            :items="abilityItems"
            :placeholder="ARMOR_CLASS_TEXT.abilitiesPlaceholder"
            :search-input="false"
            value-key="value"
            multiple
            class="w-56"
            @update:model-value="setAbilities"
          />
        </div>

        <div
          v-if="isDexLimitShown"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_TEXT.dexLimitTitle }}
          </span>

          <USelect
            :model-value="dexLimitValue"
            :items="dexLimitItems"
            class="w-56"
            @update:model-value="setDexLimit"
          />
        </div>

        <p class="text-xs text-dimmed">
          {{ abilitiesHint }}
        </p>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_TEXT.bonusTitle }}
          </span>

          <UInputNumber
            v-model="ownBonus"
            :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
            class="w-40"
          />
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4 text-sm">
          <span class="text-toned">
            {{ bodyTitle }}
          </span>

          <span class="text-toned">
            <template v-if="!breakdown.isCustom">
              {{ breakdown.bodyLabel }}
              <span class="text-muted">·</span>
            </template>

            {{ breakdown.bodyValue }}
          </span>
        </div>

        <p
          v-if="dexterityHint"
          class="text-xs text-dimmed"
        >
          {{ dexterityHint }}
        </p>

        <div
          v-for="row in rows"
          :key="row.key"
          class="flex items-center justify-between gap-4 text-sm"
        >
          <span class="text-toned">{{ row.label }}</span>

          <span class="text-toned">{{ row.formattedValue }}</span>
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">{{ ARMOR_CLASS_TEXT.totalTitle }}</span>

          <span class="text-xl font-bold text-highlighted">
            {{ breakdown.value }}
          </span>
        </div>

        <p
          v-if="!isCustom"
          class="text-xs text-dimmed"
        >
          {{ ARMOR_CLASS_TEXT.equipmentHint }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ARMOR_CLASS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="ARMOR_CLASS_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
