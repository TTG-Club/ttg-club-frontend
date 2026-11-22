<script setup lang="ts">
  import type { SkillRow } from '../model';

  import { useCharacterSheet, useSheetRoll } from '../composables';
  import {
    formatModifier,
    getCharacterLevel,
    getNextSkillProficiency,
    getProficiencyBonus,
    getSkillRows,
    SHEET_LABELS,
    SKILL_PROFICIENCY_ICON,
    SKILL_PROFICIENCY_TEXT,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Навыки: владение переключается по кругу (нет → владение →
   * компетентность), клик по названию — проверка.
   */
  const { document, update } = useCharacterSheet();
  const { rollD20 } = useSheetRoll();

  const proficiencyBonus = computed(() =>
    getProficiencyBonus(getCharacterLevel(document.value.classes)),
  );

  const rows = computed(() =>
    getSkillRows(document.value, proficiencyBonus.value).map((row) => ({
      ...row,
      bonusLabel: formatModifier(row.bonus),
      icon: SKILL_PROFICIENCY_ICON[row.proficiency],
      title: SKILL_PROFICIENCY_TEXT[row.proficiency],
      iconClass: row.proficiency === 'none' ? 'text-dimmed' : 'text-primary',
    })),
  );

  /**
   * Переключает владение навыком.
   * @param row - строка навыка
   */
  function cycleProficiency(row: SkillRow): void {
    update((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [row.key]: getNextSkillProficiency(row.proficiency),
      },
    }));
  }

  /**
   * Проверка навыка.
   * @param row - строка навыка
   * @param event - клик
   */
  function rollSkill(row: SkillRow, event: MouseEvent): void {
    rollD20(row.name, row.bonus, event);
  }
</script>

<template>
  <SheetPanel :title="SHEET_LABELS.skills">
    <ul class="flex flex-col">
      <li
        v-for="row in rows"
        :key="row.key"
        class="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-elevated"
      >
        <UTooltip :text="row.title">
          <button
            type="button"
            class="flex items-center"
            :aria-label="row.title"
            @click.left.exact.prevent="cycleProficiency(row)"
          >
            <UIcon
              :name="row.icon"
              class="size-4"
              :class="row.iconClass"
            />
          </button>
        </UTooltip>

        <span
          class="w-8 text-right font-semibold text-highlighted tabular-nums"
        >
          {{ row.bonusLabel }}
        </span>

        <button
          type="button"
          class="flex-1 text-left text-sm hover:text-primary"
          @click.left.prevent="rollSkill(row, $event)"
        >
          {{ row.name }}
        </button>

        <span class="text-xs text-muted">{{ row.abilityShort }}</span>
      </li>
    </ul>
  </SheetPanel>
</template>
