<script setup lang="ts">
  import type {
    AbilityKey,
    CustomBonus,
    SkillKey,
    SkillProficiency,
  } from '../model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import { SheetSkillsSettingsModal } from '../dialogs';
  import {
    ABILITY_LABELS,
    describeSkillBonus,
    formatModifier,
    getCustomBonusParts,
    getNextSkillProficiency,
    getSkillAbility,
    getSkillProficiency,
    getSkillProficiencyBonus,
    getSkillRowGroups,
    PROFICIENCY_DOT_ICONS,
    SHEET_BODY_LABELS,
    SHEET_GROUP_LABEL_CLASS,
    SHEET_SKILL_SETTINGS_LABELS,
    SHEET_TITLE_ACTION_CLASS,
    SHEET_TITLE_ACTION_REVEAL_CLASS,
    SKILL_EFFECT_KEYS,
    SKILL_INFO,
    SKILL_KEYS,
    SKILL_PROFICIENCY_TEXT,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Строка навыка: правил или свой. */
  interface SkillPanelRow {
    key: string;
    /** Дополнительные бонусы навыка: для разбора и подсветки. */
    bonuses: ReadonlyArray<CustomBonus>;
    /** Характеристика подменена в настройке. */
    isAbilityChanged: boolean;
    /** Навык правил; null — свой навык. */
    skillKey: SkillKey | null;
    name: string;
    ability: AbilityKey;
    proficiency: SkillProficiency;
    bonus: number;
  }

  /** Пассивная проверка: 10 + бонус навыка. */
  const PASSIVE_BASE = 10;

  /**
   * Навыки списком: значок владения (клик — по кругу «нет → половина →
   * владение → компетентность»), характеристика (своя, если её подменили в
   * настройке), название, бонус с эффектами и своими бонусами (клик —
   * проверка с преимуществом или помехой от эффектов) и пассивное значение.
   * Свои навыки встают в общий список по алфавиту; по настройке список
   * группируется по характеристикам. Шестерёнка открывает настройку.
   */
  const {
    document,
    update,
    editControlClass,
    ensureEditable,
    highlightedAbility,
  } = useCharacterSheet();

  /** Подсветка навыков наведённой характеристики. */
  const HIGHLIGHTED_ROW_CLASS =
    'bg-primary/10 ring-1 ring-primary/50 ring-inset';

  const { stats } = useSheetStats();
  const { rollD20 } = useSheetRoll();

  const isSettingsOpen = ref(false);

  function openSettings(): void {
    if (!ensureEditable()) {
      return;
    }

    isSettingsOpen.value = true;
  }

  const rows = computed<Array<SkillPanelRow>>(() =>
    [
      ...SKILL_KEYS.map((key) => ({
        key,
        skillKey: key,
        name: SKILL_INFO[key].names[0],
        ability: getSkillAbility(document.value, key),
        proficiency: getSkillProficiency(document.value, key),
        bonus: stats.value.skills[key],
        bonuses: document.value.skillBonuses[key] ?? [],
        isAbilityChanged: key in document.value.skillAbilities,
      })),
      ...document.value.customSkills.map((skill) => ({
        key: skill.id,
        skillKey: null,
        name: skill.name,
        ability: skill.ability,
        proficiency: skill.proficiency,
        bonus: stats.value.customSkills[skill.id] ?? 0,
        bonuses: skill.bonuses,
        isAbilityChanged: false,
      })),
    ].sort((left, right) => left.name.localeCompare(right.name)),
  );

  const bonusContext = computed(() => stats.value.bonusContext);

  /**
   * Разбор итога навыка; пусто — итог сводится к характеристике и владению.
   * @param row - строка навыка
   */
  function getBonusHint(row: SkillPanelRow): string {
    const abilityPart = {
      label: ABILITY_LABELS[row.ability].name,
      value: bonusContext.value.abilityModifiers[row.ability],
    };

    const proficiencyPart = {
      label: SKILL_PROFICIENCY_TEXT[row.proficiency],
      value: getSkillProficiencyBonus(
        row.proficiency,
        stats.value.proficiencyBonus,
      ),
    };

    const parts = [
      abilityPart,
      proficiencyPart,
      ...getCustomBonusParts(
        row.bonuses,
        bonusContext.value,
        document.value.classes,
      ),
    ];

    const knownTotal = parts.reduce((sum, part) => sum + part.value, 0);

    if (
      !row.bonuses.length
      && !row.isAbilityChanged
      && knownTotal === row.bonus
    ) {
      return '';
    }

    return describeSkillBonus(parts, row.bonus, formatModifier);
  }

  const groups = computed(() =>
    getSkillRowGroups(rows.value, document.value.groupSkillsByAbility).map(
      (group) => ({
        key: group.key,
        title: group.title,
        // Под разделителем характеристику называет он сам: в строках она не
        // повторяется
        withAbilityLabel: group.ability === null,
        titleClass:
          group.ability !== null && group.ability === highlightedAbility.value
            ? `${SHEET_GROUP_LABEL_CLASS} text-primary`
            : SHEET_GROUP_LABEL_CLASS,
        rows: group.rows.map((row) => ({
          ...row,
          bonusHint: getBonusHint(row),
          rowClass: isRowHighlighted(row) ? HIGHLIGHTED_ROW_CLASS : undefined,
          abilityLabelClass:
            row.ability === highlightedAbility.value
              ? 'text-primary'
              : 'text-dimmed',
          abilityLabel: ABILITY_LABELS[row.ability].short,
          formattedModifier: formatModifier(row.bonus),
          passiveValue: PASSIVE_BASE + row.bonus,
          icon: PROFICIENCY_DOT_ICONS[row.proficiency],
          iconClass:
            row.proficiency === 'none' ? 'text-dimmed' : 'text-primary',
          proficiencyLabel: SKILL_PROFICIENCY_TEXT[row.proficiency],
        })),
      }),
    ),
  );

  /**
   * Подсвечена ли строка: навык от наведённой характеристики или у него есть
   * бонус-модификатор этой характеристики.
   * @param row - строка навыка
   */
  function isRowHighlighted(row: SkillPanelRow): boolean {
    const ability = highlightedAbility.value;

    if (!ability) {
      return false;
    }

    return (
      row.ability === ability
      || row.bonuses.some(
        (bonus) => bonus.kind === 'ability' && bonus.ability === ability,
      )
    );
  }

  /**
   * Переключает владение навыком.
   * @param row - строка навыка
   */
  function cycle(row: SkillPanelRow): void {
    if (!ensureEditable()) {
      return;
    }

    const next = getNextSkillProficiency(row.proficiency);
    const { skillKey } = row;

    update((current) =>
      skillKey
        ? { ...current, skills: { ...current.skills, [skillKey]: next } }
        : {
            ...current,
            customSkills: current.customSkills.map((skill) =>
              skill.id === row.key ? { ...skill, proficiency: next } : skill,
            ),
          },
    );
  }

  /**
   * Проверка навыка.
   * @param row - строка навыка
   * @param event - клик
   */
  function roll(row: SkillPanelRow, event: MouseEvent): void {
    rollD20(row.name, row.bonus, event, {
      kind: 'skill',
      skill: row.skillKey ? SKILL_EFFECT_KEYS[row.skillKey] : undefined,
      ability: row.ability.toLowerCase(),
    });
  }
</script>

<template>
  <SheetPanel :title="SHEET_BODY_LABELS.skills">
    <template #title-actions>
      <button
        type="button"
        :class="[
          SHEET_TITLE_ACTION_CLASS,
          SHEET_TITLE_ACTION_REVEAL_CLASS,
          editControlClass,
        ]"
        :aria-label="SHEET_SKILL_SETTINGS_LABELS.open"
        @click.left.exact.prevent="openSettings"
      >
        <UIcon
          name="tabler:settings"
          class="size-3.5"
        />
      </button>
    </template>

    <div class="flex flex-col gap-0.5">
      <template
        v-for="group in groups"
        :key="group.key"
      >
        <USeparator
          v-if="group.title"
          :label="group.title"
          position="start"
          class="px-2 pt-2 first:pt-0"
          :ui="{ label: group.titleClass }"
        />

        <div
          v-for="row in group.rows"
          :key="row.key"
          class="relative flex items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-accented/40"
          :class="row.rowClass"
        >
          <UTooltip
            :text="row.proficiencyLabel"
            :content="{ side: 'top' }"
          >
            <button
              type="button"
              class="z-10 flex cursor-pointer items-center"
              :aria-label="`${SHEET_BODY_LABELS.proficiency}: ${row.name}`"
              @click.left.exact.prevent="cycle(row)"
            >
              <UIcon
                :name="row.icon"
                class="size-3.5 shrink-0 transition-colors hover:text-primary"
                :class="row.iconClass"
              />
            </button>
          </UTooltip>

          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center gap-3 after:absolute after:inset-0 after:cursor-pointer"
            :aria-label="`${SHEET_BODY_LABELS.roll}: ${row.name}`"
            @click.left.prevent="roll(row, $event)"
          >
            <span
              v-if="group.withAbilityLabel"
              class="w-8 shrink-0 text-left text-[10px] font-medium uppercase transition-colors"
              :class="row.abilityLabelClass"
            >
              {{ row.abilityLabel }}
            </span>

            <span class="min-w-0 grow truncate text-left text-sm text-toned">
              {{ row.name }}
            </span>

            <!-- Итог не сводится к характеристике и владению: пунктир зовёт
              навести и прочитать разбор. `z-10` поднимает подпись над
              растяжкой кнопки броска -->
            <UTooltip
              v-if="row.bonusHint"
              :text="row.bonusHint"
              :content="{ side: 'top' }"
            >
              <span
                class="z-10 shrink-0 text-sm font-bold text-highlighted underline decoration-dotted underline-offset-2"
              >
                {{ row.formattedModifier }}
              </span>
            </UTooltip>

            <span
              v-else
              class="shrink-0 text-sm font-bold text-highlighted"
            >
              {{ row.formattedModifier }}
            </span>

            <UTooltip :text="SHEET_BODY_LABELS.passive">
              <span class="z-10 w-6 shrink-0 text-right text-xs text-dimmed">
                {{ row.passiveValue }}
              </span>
            </UTooltip>
          </button>
        </div>
      </template>
    </div>

    <SheetSkillsSettingsModal v-model:open="isSettingsOpen" />
  </SheetPanel>
</template>
