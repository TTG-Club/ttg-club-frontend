<script setup lang="ts">
  import type {
    AbilityKey,
    CustomBonus,
    SkillKey,
    SkillProficiency,
  } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    createCustomBonus,
    createSheetElementId,
    CUSTOM_SKILL_NAME_MAX_LENGTH,
    CUSTOM_SKILLS_MAX,
    DEFAULT_CUSTOM_SKILL_ABILITY,
    formatModifier,
    getCustomBonusesTotal,
    getNextSkillProficiency,
    getSkillAbility,
    getSkillProficiency,
    getSkillProficiencyBonus,
    getSkillRowGroups,
    hasSkillName,
    SHEET_GROUP_LABEL_CLASS,
    SHEET_SKILL_SETTINGS_LABELS,
    SKILL_INFO,
    SKILL_KEYS,
    SKILL_PROFICIENCY_ICON,
    SKILL_PROFICIENCY_TEXT,
  } from '../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /** Навык в черновике окна: правил или свой. */
  interface DraftSkill {
    /** Ключ строки: навык правил или идентификатор своего. */
    key: string;
    /** Навык правил; null — свой навык. */
    skillKey: SkillKey | null;
    name: string;
    ability: AbilityKey;
    /** Характеристика по правилам; null — у своего навыка правил нет. */
    defaultAbility: AbilityKey | null;
    proficiency: SkillProficiency;
    bonuses: Array<CustomBonus>;
  }

  /** Пассивная проверка: 10 + бонус навыка. */
  const PASSIVE_CHECK_BASE = 10;

  /**
   * Настройка навыков, как на new.ttg.club: уровень владения (значок по
   * кругу «нет → половина → владение → компетентность»), характеристика
   * навыка, дополнительные бонусы, свои навыки и группировка по
   * характеристикам. Правки копятся в черновике и уходят в лист по
   * «Применить»; итоги пересчитываются сразу.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const draftSkills = ref<Array<DraftSkill>>([]);
  const isGrouped = ref(false);
  const customName = ref('');
  const customAbility = ref<AbilityKey>(DEFAULT_CUSTOM_SKILL_ABILITY);

  const abilityItems = ABILITY_KEYS.map((key) => ({
    value: key,
    label: ABILITY_LABELS[key].name,
  }));

  /**
   * Черновик по алфавиту названий.
   * @param skills - навыки
   */
  function sortByName(skills: Array<DraftSkill>): Array<DraftSkill> {
    return [...skills].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  // Черновик заново снимается с листа при каждом открытии окна; бонусы
  // копируются, иначе правки уходили бы в лист мимо «Применить»
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    const current = document.value;

    draftSkills.value = sortByName([
      ...SKILL_KEYS.map((key) => ({
        key,
        skillKey: key,
        name: SKILL_INFO[key].names[0],
        ability: getSkillAbility(current, key),
        defaultAbility: SKILL_INFO[key].ability,
        proficiency: getSkillProficiency(current, key),
        bonuses: (current.skillBonuses[key] ?? []).map((bonus) => ({
          ...bonus,
        })),
      })),
      ...current.customSkills.map((skill) => ({
        key: skill.id,
        skillKey: null,
        name: skill.name,
        ability: skill.ability,
        defaultAbility: null,
        proficiency: skill.proficiency,
        bonuses: skill.bonuses.map((bonus) => ({ ...bonus })),
      })),
    ]);

    isGrouped.value = current.groupSkillsByAbility;
    customName.value = '';
  });

  const bonusContext = computed(() => stats.value.bonusContext);

  /**
   * Итог навыка без эффектов: модификатор, доля мастерства и бонусы.
   * @param ability - характеристика
   * @param proficiency - уровень владения
   * @param bonuses - дополнительные бонусы
   */
  function getBaseValue(
    ability: AbilityKey,
    proficiency: SkillProficiency,
    bonuses: ReadonlyArray<CustomBonus>,
  ): number {
    return (
      bonusContext.value.abilityModifiers[ability]
      + getSkillProficiencyBonus(proficiency, stats.value.proficiencyBonus)
      + getCustomBonusesTotal(bonuses, bonusContext.value)
    );
  }

  /**
   * Итог навыка по черновику. У навыка правил итог листа уже включает
   * эффекты: в нём подменяется только записанная часть на черновую.
   * @param skill - навык черновика
   */
  function getDraftValue(skill: DraftSkill): number {
    const draftBase = getBaseValue(
      skill.ability,
      skill.proficiency,
      skill.bonuses,
    );

    if (!skill.skillKey) {
      return draftBase;
    }

    const current = document.value;

    const savedBase = getBaseValue(
      getSkillAbility(current, skill.skillKey),
      getSkillProficiency(current, skill.skillKey),
      current.skillBonuses[skill.skillKey] ?? [],
    );

    return stats.value.skills[skill.skillKey] - savedBase + draftBase;
  }

  const groups = computed(() =>
    getSkillRowGroups(draftSkills.value, isGrouped.value).map((group) => ({
      ...group,
      rows: group.rows.map((skill) => {
        const value = getDraftValue(skill);
        const isCustom = !skill.skillKey;

        const isChanged =
          !isCustom
          && (skill.ability !== skill.defaultAbility
            || skill.bonuses.length > 0);

        return {
          skill,
          isCustom,
          isChanged,
          formattedValue: formatModifier(value),
          passiveValue: PASSIVE_CHECK_BASE + value,
          icon: SKILL_PROFICIENCY_ICON[skill.proficiency],
          iconClass:
            skill.proficiency === 'none' ? 'text-muted' : 'text-primary',
          proficiencyLabel: SKILL_PROFICIENCY_TEXT[skill.proficiency],
          frameClass:
            isCustom || isChanged ? 'border-primary/40' : 'border-default/50',
        };
      }),
    })),
  );

  const customCount = computed(
    () => draftSkills.value.filter((skill) => !skill.skillKey).length,
  );

  const isCustomLimitReached = computed(
    () => customCount.value >= CUSTOM_SKILLS_MAX,
  );

  const isCustomDuplicate = computed(
    () =>
      customName.value.trim().length > 0
      && hasSkillName(
        draftSkills.value.map((skill) => skill.name),
        customName.value,
      ),
  );

  const isCustomAddDisabled = computed(
    () =>
      !customName.value.trim()
      || isCustomDuplicate.value
      || isCustomLimitReached.value,
  );

  const customHint = computed(() => {
    if (isCustomDuplicate.value) {
      return SHEET_SKILL_SETTINGS_LABELS.customDuplicate;
    }

    if (isCustomLimitReached.value) {
      return `${SHEET_SKILL_SETTINGS_LABELS.customLimit} ${CUSTOM_SKILLS_MAX}`;
    }

    return SHEET_SKILL_SETTINGS_LABELS.customHint;
  });

  const customHintClass = computed(() =>
    isCustomDuplicate.value || isCustomLimitReached.value
      ? 'text-warning'
      : 'text-dimmed',
  );

  /**
   * Уровень владения по кругу.
   * @param skill - навык черновика
   */
  function cycleProficiency(skill: DraftSkill): void {
    skill.proficiency = getNextSkillProficiency(skill.proficiency);
  }

  /**
   * Возвращает навык к правилам: характеристика по правилам, без бонусов.
   * @param skill - навык черновика
   */
  function resetSkill(skill: DraftSkill): void {
    if (!skill.defaultAbility) {
      return;
    }

    skill.ability = skill.defaultAbility;
    skill.bonuses = [];
  }

  /**
   * Добавляет навыку бонус «+1»: он правится тут же в строке.
   * @param skill - навык черновика
   */
  function addBonus(skill: DraftSkill): void {
    skill.bonuses = [
      ...skill.bonuses,
      createCustomBonus(createSheetElementId()),
    ];
  }

  function addCustom(): void {
    if (isCustomAddDisabled.value) {
      return;
    }

    draftSkills.value = sortByName([
      ...draftSkills.value,
      {
        key: createSheetElementId(),
        skillKey: null,
        name: customName.value.trim(),
        ability: customAbility.value,
        defaultAbility: null,
        proficiency: 'none',
        bonuses: [],
      },
    ]);

    customName.value = '';
  }

  /**
   * Удаляет свой навык из черновика.
   * @param skill - навык черновика
   */
  function removeCustom(skill: DraftSkill): void {
    draftSkills.value = draftSkills.value.filter(
      (draft) => draft.key !== skill.key,
    );
  }

  /**
   * Бонусы для записи: очищенное поле числа превращается в ноль.
   * @param bonuses - бонусы черновика
   */
  function toStoredBonuses(
    bonuses: ReadonlyArray<CustomBonus>,
  ): Array<CustomBonus> {
    return bonuses.map((bonus) => ({
      ...bonus,
      value: Number.isFinite(bonus.value) ? Math.trunc(bonus.value) : 0,
    }));
  }

  function apply(): void {
    const skills: Partial<Record<SkillKey, SkillProficiency>> = {};
    const skillAbilities: Partial<Record<SkillKey, AbilityKey>> = {};
    const skillBonuses: Partial<Record<SkillKey, Array<CustomBonus>>> = {};

    for (const draft of draftSkills.value) {
      if (!draft.skillKey) {
        continue;
      }

      if (draft.proficiency !== 'none') {
        skills[draft.skillKey] = draft.proficiency;
      }

      if (draft.ability !== draft.defaultAbility) {
        skillAbilities[draft.skillKey] = draft.ability;
      }

      if (draft.bonuses.length) {
        skillBonuses[draft.skillKey] = toStoredBonuses(draft.bonuses);
      }
    }

    const customSkills = draftSkills.value
      .filter((draft) => !draft.skillKey)
      .map((draft) => ({
        id: draft.key,
        name: draft.name,
        ability: draft.ability,
        proficiency: draft.proficiency,
        bonuses: toStoredBonuses(draft.bonuses),
      }));

    const groupSkillsByAbility = isGrouped.value;

    update((current) => ({
      ...current,
      skills,
      skillAbilities,
      skillBonuses,
      customSkills,
      groupSkillsByAbility,
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
    :title="SHEET_SKILL_SETTINGS_LABELS.title"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SHEET_SKILL_SETTINGS_LABELS.hint }}
        </p>

        <UCheckbox
          v-model="isGrouped"
          :label="SHEET_SKILL_SETTINGS_LABELS.groupTitle"
          :description="SHEET_SKILL_SETTINGS_LABELS.groupHint"
          class="rounded-lg border border-dashed border-default/70 p-2"
        />

        <!-- Свой навык над списком: в хвосте из восемнадцати навыков
          добавление пришлось бы искать прокруткой -->
        <div
          class="flex flex-col gap-2 rounded-lg border border-dashed border-default/70 p-2"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SHEET_SKILL_SETTINGS_LABELS.customTitle }}
            </span>

            <div class="flex w-full items-center gap-2 sm:w-auto sm:grow">
              <UInput
                v-model="customName"
                size="sm"
                class="min-w-0 grow"
                :maxlength="CUSTOM_SKILL_NAME_MAX_LENGTH"
                :disabled="isCustomLimitReached"
                :placeholder="SHEET_SKILL_SETTINGS_LABELS.customNamePlaceholder"
                @keydown.enter.prevent="addCustom"
              />

              <USelect
                v-model="customAbility"
                :items="abilityItems"
                size="sm"
                class="w-32 shrink-0 sm:w-40"
                :disabled="isCustomLimitReached"
                :aria-label="SHEET_SKILL_SETTINGS_LABELS.abilityPlaceholder"
              />

              <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.customAdd">
                <UButton
                  icon="tabler:plus"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  square
                  class="shrink-0"
                  :disabled="isCustomAddDisabled"
                  :aria-label="SHEET_SKILL_SETTINGS_LABELS.customAdd"
                  @click.left.exact.prevent="addCustom"
                />
              </UTooltip>
            </div>
          </div>

          <p
            class="text-xs"
            :class="customHintClass"
          >
            {{ customHint }}
          </p>
        </div>

        <template
          v-for="group in groups"
          :key="group.key"
        >
          <USeparator
            v-if="group.title"
            :label="group.title"
            position="start"
            class="pt-1"
            :ui="{ label: SHEET_GROUP_LABEL_CLASS }"
          />

          <div
            v-for="row in group.rows"
            :key="row.skill.key"
            class="flex flex-col gap-2 rounded-lg border bg-elevated/20 p-2 transition-colors"
            :class="row.frameClass"
          >
            <div class="flex flex-wrap items-center gap-2">
              <UTooltip
                :text="row.proficiencyLabel"
                :content="{ side: 'top' }"
              >
                <button
                  type="button"
                  class="flex shrink-0 cursor-pointer items-center"
                  :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.proficiency}: ${row.skill.name}`"
                  @click.left.exact.prevent="cycleProficiency(row.skill)"
                >
                  <UIcon
                    :name="row.icon"
                    class="size-4 shrink-0 transition-colors hover:text-primary"
                    :class="row.iconClass"
                  />
                </button>
              </UTooltip>

              <span class="min-w-0 grow truncate text-sm text-toned">
                {{ row.skill.name }}
              </span>

              <span
                v-if="row.isCustom"
                class="shrink-0 rounded border border-primary/40 px-1.5 text-[10px] font-bold tracking-wider text-primary uppercase"
              >
                {{ SHEET_SKILL_SETTINGS_LABELS.customBadge }}
              </span>

              <span
                class="w-8 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
              >
                {{ row.formattedValue }}
              </span>

              <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.passive">
                <span class="w-6 text-right text-xs text-dimmed tabular-nums">
                  {{ row.passiveValue }}
                </span>
              </UTooltip>

              <!-- Отдельная группа: на узком окне она переносится под
                название целой строкой -->
              <div class="flex w-full items-center gap-2 sm:w-auto">
                <USelect
                  v-model="row.skill.ability"
                  :items="abilityItems"
                  size="sm"
                  class="min-w-0 grow sm:w-40 sm:grow-0"
                  :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.abilityPlaceholder}: ${row.skill.name}`"
                />

                <UTooltip
                  v-if="row.isCustom"
                  :text="SHEET_SKILL_SETTINGS_LABELS.customRemove"
                >
                  <UButton
                    icon="tabler:trash"
                    color="error"
                    variant="ghost"
                    size="xs"
                    square
                    :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.customRemove}: ${row.skill.name}`"
                    @click.left.exact.prevent="removeCustom(row.skill)"
                  />
                </UTooltip>

                <UTooltip
                  v-else
                  :text="SHEET_SKILL_SETTINGS_LABELS.resetSkill"
                >
                  <UButton
                    icon="tabler:rotate"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    :disabled="!row.isChanged"
                    :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.resetSkill}: ${row.skill.name}`"
                    @click.left.exact.prevent="resetSkill(row.skill)"
                  />
                </UTooltip>

                <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.addBonus">
                  <UButton
                    icon="tabler:plus"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    square
                    :aria-label="`${SHEET_SKILL_SETTINGS_LABELS.addBonus}: ${row.skill.name}`"
                    @click.left.exact.prevent="addBonus(row.skill)"
                  />
                </UTooltip>
              </div>
            </div>

            <SheetCustomBonusRows
              v-if="row.skill.bonuses.length"
              v-model="row.skill.bonuses"
              :classes="document.classes"
              :context="bonusContext"
              :with-add="false"
              class="border-l-2 border-primary/40 pl-2"
            />
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_SKILL_SETTINGS_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SHEET_SKILL_SETTINGS_LABELS.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
