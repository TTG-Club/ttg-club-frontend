<script setup lang="ts">
  import type {
    SkillKey,
    SkillProficiencies,
    SkillProficiency,
  } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_LABELS,
    formatModifier,
    getSkillProficiencyBonus,
    SHEET_SKILL_SETTINGS_LABELS,
    SKILL_INFO,
    SKILL_KEYS,
    SKILL_PROFICIENCY_CYCLE,
    SKILL_PROFICIENCY_ICON,
    SKILL_PROFICIENCY_SHORT_TEXT,
    SKILL_PROFICIENCY_TEXT,
  } from '../model';

  /**
   * Настройка навыков: у каждого навыка — уровень владения на выбор (нет,
   * половина бонуса мастерства, владение, компетентность). Правки копятся в
   * черновике и уходят в лист по «Применить»; итог навыка пересчитывается
   * сразу, с учётом эффектов листа.
   */
  /** Пассивная проверка: 10 + бонус навыка. */
  const PASSIVE_CHECK_BASE = 10;

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const draft = ref<SkillProficiencies>({});

  // Черновик заново снимается с листа при каждом открытии окна
  watch(isOpen, (opened) => {
    if (opened) {
      draft.value = { ...document.value.skills };
    }
  });

  const options = SKILL_PROFICIENCY_CYCLE.map((value) => ({
    value,
    label: SKILL_PROFICIENCY_SHORT_TEXT[value],
    icon: SKILL_PROFICIENCY_ICON[value],
    tooltip: SKILL_PROFICIENCY_TEXT[value],
  }));

  const rows = computed(() =>
    SKILL_KEYS.map((key) => {
      const proficiency = draft.value[key] ?? 'none';
      const saved = document.value.skills[key] ?? 'none';

      // Итог листа уже включает эффекты и сохранённое владение: подменяем
      // в нём только вклад владения на черновой
      const bonus =
        stats.value.skills[key]
        - getSkillProficiencyBonus(saved, stats.value.proficiencyBonus)
        + getSkillProficiencyBonus(proficiency, stats.value.proficiencyBonus);

      return {
        key,
        name: SKILL_INFO[key].names[0],
        abilityLabel: ABILITY_LABELS[SKILL_INFO[key].ability].short,
        proficiency,
        formattedBonus: formatModifier(bonus),
        passiveValue: PASSIVE_CHECK_BASE + bonus,
      };
    }).sort((left, right) => left.name.localeCompare(right.name)),
  );

  /**
   * Ставит уровень владения навыком в черновике.
   * @param key - навык
   * @param proficiency - уровень владения
   */
  function setProficiency(key: SkillKey, proficiency: SkillProficiency): void {
    draft.value = { ...draft.value, [key]: proficiency };
  }

  /**
   * Класс кнопки уровня: выбранная подсвечена.
   * @param current - уровень навыка
   * @param value - уровень кнопки
   */
  function getOptionVariant(
    current: SkillProficiency,
    value: SkillProficiency,
  ): 'solid' | 'ghost' {
    return current === value ? 'solid' : 'ghost';
  }

  function apply(): void {
    const skills = { ...draft.value };

    update((current) => ({ ...current, skills }));
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
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SHEET_SKILL_SETTINGS_LABELS.hint }}
        </p>

        <div
          v-for="row in rows"
          :key="row.key"
          class="flex flex-wrap items-center gap-2 rounded-lg border border-default/50 bg-elevated/20 px-2 py-1.5"
        >
          <UIcon
            :name="SKILL_PROFICIENCY_ICON[row.proficiency]"
            class="size-4 shrink-0"
            :class="row.proficiency === 'none' ? 'text-dimmed' : 'text-primary'"
          />

          <span
            class="w-8 shrink-0 text-[10px] font-medium text-dimmed uppercase"
          >
            {{ row.abilityLabel }}
          </span>

          <span class="min-w-0 grow truncate text-sm text-toned">
            {{ row.name }}
          </span>

          <UFieldGroup size="xs">
            <UTooltip
              v-for="option in options"
              :key="option.value"
              :text="option.tooltip"
            >
              <UButton
                :label="option.label"
                :variant="getOptionVariant(row.proficiency, option.value)"
                :color="
                  row.proficiency === option.value ? 'primary' : 'neutral'
                "
                :aria-label="`${row.name}: ${option.tooltip}`"
                :aria-pressed="row.proficiency === option.value"
                class="min-w-9 justify-center"
                @click.left.exact.prevent="
                  setProficiency(row.key, option.value)
                "
              />
            </UTooltip>
          </UFieldGroup>

          <span
            class="w-8 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
          >
            {{ row.formattedBonus }}
          </span>

          <UTooltip :text="SHEET_SKILL_SETTINGS_LABELS.passive">
            <span
              class="w-6 shrink-0 text-right text-xs text-dimmed tabular-nums"
            >
              {{ row.passiveValue }}
            </span>
          </UTooltip>
        </div>
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
