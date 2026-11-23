<script setup lang="ts">
  import type { SkillKey } from '../model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    ABILITY_LABELS,
    formatModifier,
    getNextSkillProficiency,
    getSkillProficiency,
    PROFICIENCY_DOT_ICONS,
    SHEET_BODY_LABELS,
    SKILL_EFFECT_KEYS,
    SKILL_INFO,
    SKILL_KEYS,
    SKILL_PROFICIENCY_TEXT,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Пассивная проверка: 10 + бонус навыка. */
  const PASSIVE_BASE = 10;

  /**
   * Навыки списком: точка владения (клик — по кругу «нет → владение →
   * компетентность»), сокращение характеристики, название, бонус с эффектами
   * (клик — проверка с преимуществом или помехой от эффектов) и пассивное
   * значение.
   */
  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollD20 } = useSheetRoll();

  const rows = computed(() =>
    SKILL_KEYS.map((key) => {
      const proficiency = getSkillProficiency(document.value, key);
      const bonus = stats.value.skills[key];

      return {
        key,
        name: SKILL_INFO[key].names[0],
        abilityLabel: ABILITY_LABELS[SKILL_INFO[key].ability].short,
        bonus,
        formattedModifier: formatModifier(bonus),
        passiveValue: PASSIVE_BASE + bonus,
        icon: PROFICIENCY_DOT_ICONS[proficiency],
        iconClass: proficiency === 'none' ? 'text-dimmed' : 'text-primary',
        proficiencyLabel: SKILL_PROFICIENCY_TEXT[proficiency],
      };
    }).sort((left, right) => left.name.localeCompare(right.name)),
  );

  /**
   * Переключает владение навыком.
   * @param key - навык
   */
  function cycle(key: SkillKey): void {
    update((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [key]: getNextSkillProficiency(getSkillProficiency(current, key)),
      },
    }));
  }

  /**
   * Проверка навыка.
   * @param key - навык
   * @param name - название
   * @param bonus - бонус
   * @param event - клик
   */
  function roll(
    key: SkillKey,
    name: string,
    bonus: number,
    event: MouseEvent,
  ): void {
    rollD20(name, bonus, event, {
      kind: 'skill',
      skill: SKILL_EFFECT_KEYS[key],
      ability: SKILL_INFO[key].ability.toLowerCase(),
    });
  }
</script>

<template>
  <SheetPanel :title="SHEET_BODY_LABELS.skills">
    <div class="flex flex-col gap-0.5">
      <div
        v-for="row in rows"
        :key="row.key"
        class="relative flex items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-accented/40"
      >
        <UTooltip
          :text="row.proficiencyLabel"
          :content="{ side: 'top' }"
        >
          <button
            type="button"
            class="z-10 flex cursor-pointer items-center"
            :aria-label="`${SHEET_BODY_LABELS.proficiency}: ${row.name}`"
            @click.left.exact.prevent="cycle(row.key)"
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
          @click.left.prevent="roll(row.key, row.name, row.bonus, $event)"
        >
          <span
            class="w-8 shrink-0 text-left text-[10px] font-medium text-dimmed uppercase"
          >
            {{ row.abilityLabel }}
          </span>

          <span class="min-w-0 grow truncate text-left text-sm text-toned">
            {{ row.name }}
          </span>

          <span class="shrink-0 text-sm font-bold text-highlighted">
            {{ row.formattedModifier }}
          </span>

          <UTooltip :text="SHEET_BODY_LABELS.passive">
            <span class="z-10 w-6 shrink-0 text-right text-xs text-dimmed">
              {{ row.passiveValue }}
            </span>
          </UTooltip>
        </button>
      </div>
    </div>
  </SheetPanel>
</template>
