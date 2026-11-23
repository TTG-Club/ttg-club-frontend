<script setup lang="ts">
  import type { AbilityKey, CustomBonus } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    createCustomBonus,
    createSheetElementId,
    CUSTOM_BONUS_KINDS,
    DEFAULT_INITIATIVE_ABILITY,
    DEFAULT_WEAPON_ATTACK_ABILITY,
    formatModifier,
    getAbilityModifier,
    getCharacterLevel,
    getCustomBonusesTotal,
    getProficiencyBonus,
    PROFICIENCY_BONUS_KINDS,
    SETTINGS_BASE_SOURCE,
    SHEET_SETTINGS_TABS,
    SHEET_SETTINGS_TEXT,
    WEAPON_ATTACK_ABILITY_AUTO,
  } from '../model';
  import SheetBonusSection from './SheetBonusSection.vue';

  /**
   * Настройки листа, как на new.ttg.club: базовая характеристика атаки
   * оружием, основа и свои бонусы бонуса мастерства и инициативы. Правки
   * копятся в черновике и уходят в лист по «Применить».
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const tabs = [...SHEET_SETTINGS_TABS];

  const defaultTab = SHEET_SETTINGS_TABS[0].value;

  const weaponAbility = ref<string>(WEAPON_ATTACK_ABILITY_AUTO);
  const proficiencyBaseSource = ref<string>(SETTINGS_BASE_SOURCE.level);
  const proficiencyBaseValue = ref(0);
  const proficiencyBonuses = ref<Array<CustomBonus>>([]);
  const initiativeBaseSource = ref<string>(DEFAULT_INITIATIVE_ABILITY);
  const initiativeBaseValue = ref(0);
  const initiativeBonuses = ref<Array<CustomBonus>>([]);

  const abilityItems = ABILITY_KEYS.map((key) => ({
    value: key,
    label: ABILITY_LABELS[key].name,
  }));

  const weaponAbilityItems = [
    {
      value: WEAPON_ATTACK_ABILITY_AUTO,
      label: SHEET_SETTINGS_TEXT.weaponAbilityAuto,
    },
    ...abilityItems,
  ];

  const proficiencyBaseItems = [
    { value: SETTINGS_BASE_SOURCE.level, label: SHEET_SETTINGS_TEXT.levelBase },
    { value: SETTINGS_BASE_SOURCE.flat, label: SHEET_SETTINGS_TEXT.flatBase },
  ];

  const initiativeBaseItems = [
    ...abilityItems,
    { value: SETTINGS_BASE_SOURCE.flat, label: SHEET_SETTINGS_TEXT.flatBase },
  ];

  const levelProficiencyBonus = computed(() =>
    getProficiencyBonus(getCharacterLevel(document.value.classes)),
  );

  /**
   * Модификатор характеристики с бонусами и эффектами листа.
   * @param ability - характеристика
   */
  function getModifier(ability: AbilityKey): number {
    return getAbilityModifier(stats.value.abilities[ability]);
  }

  /**
   * Характеристика из значения выпадающего списка.
   * @param value - значение пункта
   */
  function toAbility(value: string): AbilityKey | undefined {
    return ABILITY_KEYS.find((key) => key === value);
  }

  // Черновик снимается с листа при каждом открытии. Старый числовой бонус
  // инициативы переезжает в свои бонусы строкой: отдельного поля для него
  // в окне нет
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    const current = document.value;

    const initiativeAbility =
      current.initiativeAbility ?? DEFAULT_INITIATIVE_ABILITY;

    weaponAbility.value =
      current.weaponAttackAbility ?? WEAPON_ATTACK_ABILITY_AUTO;

    proficiencyBaseSource.value =
      current.proficiencyBase === null
        ? SETTINGS_BASE_SOURCE.level
        : SETTINGS_BASE_SOURCE.flat;

    proficiencyBaseValue.value =
      current.proficiencyBase ?? levelProficiencyBonus.value;

    proficiencyBonuses.value = current.proficiencyBonuses.map((bonus) => ({
      ...bonus,
    }));

    initiativeBaseSource.value =
      current.initiativeBase === null
        ? initiativeAbility
        : SETTINGS_BASE_SOURCE.flat;

    initiativeBaseValue.value =
      current.initiativeBase ?? getModifier(initiativeAbility);

    initiativeBonuses.value = [
      ...(current.initiativeBonus
        ? [
            {
              ...createCustomBonus(createSheetElementId()),
              value: current.initiativeBonus,
            },
          ]
        : []),
      ...current.initiativeBonuses.map((bonus) => ({ ...bonus })),
    ];
  });

  /** Поле числа, очищенное во время правки, считается нулём. */
  function toInteger(value: number): number {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  const proficiencyBase = computed(() =>
    proficiencyBaseSource.value === SETTINGS_BASE_SOURCE.flat
      ? toInteger(proficiencyBaseValue.value)
      : levelProficiencyBonus.value,
  );

  const initiativeBase = computed(() => {
    const ability = toAbility(initiativeBaseSource.value);

    return ability
      ? getModifier(ability)
      : toInteger(initiativeBaseValue.value);
  });

  // Свои бонусы мастерства бонус мастерства не учитывают: он нулевой
  const proficiencyContext = computed(() => ({
    ...stats.value.bonusContext,
    proficiencyBonus: 0,
  }));

  const proficiencyTotal = computed(
    () =>
      proficiencyBase.value
      + getCustomBonusesTotal(
        proficiencyBonuses.value,
        proficiencyContext.value,
      ),
  );

  const effectiveWeaponAbility = computed<AbilityKey>(
    () => toAbility(weaponAbility.value) ?? DEFAULT_WEAPON_ATTACK_ABILITY,
  );

  const isWeaponAbilityAuto = computed(
    () => weaponAbility.value === WEAPON_ATTACK_ABILITY_AUTO,
  );

  const weaponAbilityLabel = computed(
    () =>
      `${ABILITY_LABELS[effectiveWeaponAbility.value].name} · ${formatModifier(
        getModifier(effectiveWeaponAbility.value),
      )}`,
  );

  const formattedProficiency = computed(() =>
    formatModifier(proficiencyTotal.value),
  );

  const formattedWeaponAttack = computed(() =>
    formatModifier(
      proficiencyTotal.value + getModifier(effectiveWeaponAbility.value),
    ),
  );

  const formattedFinesseAttack = computed(() =>
    formatModifier(
      proficiencyTotal.value
        + Math.max(
          getModifier(effectiveWeaponAbility.value),
          getModifier('DEXTERITY'),
        ),
    ),
  );

  /**
   * Бонусы для записи: очищенное поле числа превращается в ноль.
   * @param bonuses - бонусы черновика
   */
  function toStoredBonuses(
    bonuses: ReadonlyArray<CustomBonus>,
  ): Array<CustomBonus> {
    return bonuses.map((bonus) => ({
      ...bonus,
      value: toInteger(bonus.value),
    }));
  }

  function apply(): void {
    const initiativeAbility = toAbility(initiativeBaseSource.value);

    // Основа по правилам хранится как null: иначе своё число застыло бы на
    // бонусе того уровня, на котором его вписали
    const next = {
      weaponAttackAbility: toAbility(weaponAbility.value) ?? null,
      proficiencyBase:
        proficiencyBaseSource.value === SETTINGS_BASE_SOURCE.flat
          ? toInteger(proficiencyBaseValue.value)
          : null,
      proficiencyBonuses: toStoredBonuses(proficiencyBonuses.value),
      initiativeAbility:
        initiativeAbility && initiativeAbility !== DEFAULT_INITIATIVE_ABILITY
          ? initiativeAbility
          : null,
      initiativeBase: initiativeAbility
        ? null
        : toInteger(initiativeBaseValue.value),
      initiativeBonuses: toStoredBonuses(initiativeBonuses.value),
      initiativeBonus: 0,
    };

    update((current) => ({ ...current, ...next }));

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_SETTINGS_TEXT.title"
  >
    <template #body>
      <UTabs
        :items="tabs"
        :default-value="defaultTab"
        :ui="{ root: 'flex flex-col gap-4' }"
      >
        <template #weapon>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_TEXT.weaponAbilityTitle }}
              </span>

              <USelect
                v-model="weaponAbility"
                :items="weaponAbilityItems"
                class="w-48"
              />
            </div>

            <p
              v-if="isWeaponAbilityAuto"
              class="text-xs text-dimmed"
            >
              {{ SHEET_SETTINGS_TEXT.weaponAbilityAutoHint }}
            </p>

            <div class="grid grid-cols-2 gap-3">
              <div
                class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
              >
                <span
                  class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  {{ SHEET_SETTINGS_TEXT.normalWeaponTitle }}
                </span>

                <span class="text-2xl leading-none font-bold text-highlighted">
                  {{ formattedWeaponAttack }}
                </span>
              </div>

              <div
                class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
              >
                <span
                  class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  {{ SHEET_SETTINGS_TEXT.finesseWeaponTitle }}
                </span>

                <span class="text-2xl leading-none font-bold text-highlighted">
                  {{ formattedFinesseAttack }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_TEXT.abilityModifierTitle }}
              </span>

              <span class="text-toned">{{ weaponAbilityLabel }}</span>
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-toned">
                {{ SHEET_SETTINGS_TEXT.proficiencyBonusTitle }}
              </span>

              <span class="text-toned">{{ formattedProficiency }}</span>
            </div>

            <p class="text-xs text-dimmed">
              {{ SHEET_SETTINGS_TEXT.attackFormulaHint }}
            </p>
          </div>
        </template>

        <template #bonuses>
          <div class="flex flex-col gap-4">
            <SheetBonusSection
              v-model="proficiencyBonuses"
              v-model:base-source="proficiencyBaseSource"
              v-model:base-custom-value="proficiencyBaseValue"
              :classes="document.classes"
              :context="proficiencyContext"
              :title="SHEET_SETTINGS_TEXT.proficiencyBonusTitle"
              :base-items="proficiencyBaseItems"
              :kinds="PROFICIENCY_BONUS_KINDS"
              :base-value="proficiencyBase"
              :total-label="SHEET_SETTINGS_TEXT.totalProficiencyBonusTitle"
              :hint="SHEET_SETTINGS_TEXT.proficiencyHint"
            />

            <USeparator />

            <SheetBonusSection
              v-model="initiativeBonuses"
              v-model:base-source="initiativeBaseSource"
              v-model:base-custom-value="initiativeBaseValue"
              :classes="document.classes"
              :context="stats.bonusContext"
              :title="SHEET_SETTINGS_TEXT.initiativeTitle"
              :base-items="initiativeBaseItems"
              :kinds="CUSTOM_BONUS_KINDS"
              :base-value="initiativeBase"
              :total-label="SHEET_SETTINGS_TEXT.totalInitiativeTitle"
              :hint="SHEET_SETTINGS_TEXT.initiativeHint"
            />
          </div>
        </template>
      </UTabs>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_SETTINGS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SHEET_SETTINGS_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
