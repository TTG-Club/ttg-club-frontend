<script setup lang="ts">
  import type { AbilityKey, SheetToolProficiency } from '../model';

  import { useSheetRoll, useSheetStats } from '../composables';
  import {
    ABILITY_EFFECT_KEYS,
    ABILITY_KEYS,
    ABILITY_LABELS,
    formatModifier,
    getAbilityModifier,
    PROFICIENCY_MODAL_TEXT,
  } from '../model';

  /**
   * Проверка инструментом: характеристику выбирает игрок (воровские
   * инструменты — Ловкость, травничество — Мудрость или Интеллект), к броску
   * прибавляются её модификатор и бонус мастерства.
   */
  const { tool } = defineProps<{
    tool: SheetToolProficiency | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { stats } = useSheetStats();
  const { rollD20 } = useSheetRoll();

  /**
   * Бонус проверки от характеристики.
   * @param key - характеристика
   */
  function getBonus(key: AbilityKey): number {
    return (
      getAbilityModifier(stats.value.abilities[key])
      + stats.value.proficiencyBonus
    );
  }

  const rows = computed(() =>
    ABILITY_KEYS.map((key) => ({
      key,
      name: ABILITY_LABELS[key].name,
      bonus: formatModifier(getBonus(key)),
    })),
  );

  /**
   * Бросает проверку и закрывает окно.
   * @param key - характеристика
   * @param event - клик: с Shift — преимущество, с Ctrl — помеха
   */
  function roll(key: AbilityKey, event: MouseEvent): void {
    if (!tool) {
      return;
    }

    rollD20(
      `${tool.name} (${ABILITY_LABELS[key].short})`,
      getBonus(key),
      event,
      { kind: 'abilityCheck', ability: ABILITY_EFFECT_KEYS[key] },
    );

    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="tool?.name ?? PROFICIENCY_MODAL_TEXT.toolCheckTitle"
    :description="PROFICIENCY_MODAL_TEXT.toolCheckHint"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <UButton
            v-for="row in rows"
            :key="row.key"
            color="neutral"
            variant="subtle"
            class="justify-between"
            :aria-label="`${PROFICIENCY_MODAL_TEXT.toolCheckRoll}: ${row.name}`"
            @click.left.prevent="roll(row.key, $event)"
          >
            <span>{{ row.name }}</span>

            <span class="font-bold text-highlighted">{{ row.bonus }}</span>
          </UButton>
        </div>

        <UButton
          v-if="tool?.url"
          :to="tool.url"
          target="_blank"
          icon="tabler:external-link"
          :label="PROFICIENCY_MODAL_TEXT.openCatalog"
          color="neutral"
          variant="link"
          class="self-start"
        />
      </div>
    </template>
  </UModal>
</template>
