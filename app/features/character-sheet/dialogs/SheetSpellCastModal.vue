<script setup lang="ts">
  import type { SpellDamageTile } from '../model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetSpellcasting,
    useSheetStats,
    useSpellDetails,
  } from '../composables';
  import {
    formatDice,
    getSpellAbilityModifier,
    getSpellDamageTiles,
    parseDice,
    SPELL_CAST_TEXT,
    SPELL_TAB_TEXT,
    spendSpellSlot,
  } from '../model';

  /**
   * Сотворение заклинания круга: ячейка (обычная или договора) задаёт круг,
   * а с ним и повышение урона. Нажатие на бросок катит формулу и тратит
   * выбранную ячейку; ячейку можно потратить и без броска.
   */
  const { spellId } = defineProps<{
    spellId: string | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollDamage } = useSheetRoll();
  const { primaryAbility, getSlotOptions } = useSheetSpellcasting();
  const spellDetails = useSpellDetails();

  /** Пункт «без траты ячейки». */
  const NO_SLOT = 'none';

  const spell = computed(
    () => document.value.spells.find((entry) => entry.id === spellId) ?? null,
  );

  const slotOptions = computed(() =>
    spell.value ? getSlotOptions(spell.value.level) : [],
  );

  const selected = ref(NO_SLOT);

  watch(isOpen, (open) => {
    if (open) {
      selected.value = slotOptions.value[0]?.value ?? NO_SLOT;
    }
  });

  const slotItems = computed(() => [
    ...slotOptions.value.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    { label: SPELL_CAST_TEXT.noSlot, value: NO_SLOT },
  ]);

  const selectedOption = computed(
    () =>
      slotOptions.value.find((option) => option.value === selected.value)
      ?? null,
  );

  const damage = computed(() => {
    const current = spell.value;

    if (!current) {
      return null;
    }

    return current.url
      ? (spellDetails.get(current.url)?.damage ?? null)
      : current.damage;
  });

  const tiles = computed(() => {
    const current = spell.value;

    if (!current) {
      return [];
    }

    return getSpellDamageTiles(damage.value, {
      abilityModifier: getSpellAbilityModifier(
        current,
        primaryAbility.value,
        stats.value.bonusContext.abilityModifiers,
      ),
      characterLevel: stats.value.level,
      spellLevel: current.level,
      slotLevel: selectedOption.value?.level ?? current.level,
    });
  });

  const upcastHint = computed(() => {
    const dice = parseDice(damage.value?.upcastDice ?? '');

    return dice
      ? SPELL_CAST_TEXT.upcast(formatDice(dice.count, dice.faces))
      : '';
  });

  const title = computed(() =>
    spell.value ? SPELL_CAST_TEXT.title(spell.value.name) : '',
  );

  /** Тратит выбранную ячейку, если она выбрана. */
  function spendSelected(): void {
    const option = selectedOption.value;

    if (option) {
      update((current) => spendSpellSlot(current, option));
    }
  }

  /**
   * Бросок плитки и трата ячейки.
   * @param tile - плитка урона
   */
  function rollTile(tile: SpellDamageTile): void {
    const label = tile.isHealing
      ? SPELL_TAB_TEXT.healing
      : SPELL_TAB_TEXT.damage;

    rollDamage(`${label}: ${spell.value?.name ?? ''}`, tile.formula);
    spendSelected();
    isOpen.value = false;
  }

  function spendOnly(): void {
    spendSelected();
    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="SPELL_CAST_TEXT.slot">
          <USelect
            v-model="selected"
            :items="slotItems"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="!slotOptions.length"
          class="text-xs text-warning"
        >
          {{ SPELL_CAST_TEXT.noSlots }}
        </p>

        <div
          v-if="tiles.length"
          class="flex flex-wrap gap-2"
        >
          <button
            v-for="tile in tiles"
            :key="tile.key"
            type="button"
            class="flex cursor-pointer flex-col items-start rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/20"
            @click.left.exact.prevent="rollTile(tile)"
          >
            <span class="text-sm font-bold text-primary">
              {{ tile.formula }}
            </span>

            <span class="text-xs text-toned">
              {{ tile.isHealing ? SPELL_TAB_TEXT.healing : tile.typeLabel }}
            </span>

            <span
              v-if="tile.conditionLabel"
              class="text-xs text-dimmed"
            >
              {{ tile.conditionLabel }}
            </span>
          </button>
        </div>

        <p
          v-if="upcastHint"
          class="text-xs text-muted"
        >
          {{ upcastHint }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SPELL_CAST_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          v-if="selectedOption"
          :label="SPELL_CAST_TEXT.spendOnly"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="spendOnly"
        />
      </div>
    </template>
  </UModal>
</template>
