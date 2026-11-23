<script setup lang="ts">
  import type { CatalogOption, SheetSpell } from '../model';

  import { range } from 'es-toolkit';

  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useSheetClassData,
    useSheetStats,
  } from '../composables';
  import { SheetCatalogPicker } from '../dialogs';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    createSheetSpell,
    formatModifier,
    getCharacterPactMagic,
    getPreparedLimit,
    getSpellSlotsMax,
    loadCatalogSpell,
    PREPARED_TEXT,
    SHEET_HEADER_STAT_CLASS,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_TEXT,
    SPELL_LEVEL,
    SPELL_LEVEL_TITLE,
    SPELL_SEARCH,
    toAbilityKey,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Заклинания: базовая характеристика, Сл и бонус атаки, ячейки по кругам
   * (максимум — по таблицам классов), магия договора и список заклинаний по
   * кругам с отметкой подготовки.
   */
  const NO_ABILITY = 'none';

  const toast = useToast();
  const { document, update } = useCharacterSheet();
  const { progressions, preparedClasses } = useSheetClassData();
  const { stats } = useSheetStats();

  const isPickerOpen = ref(false);

  const abilityOptions = [
    { label: SHEET_LABELS.noSpellcasting, value: NO_ABILITY },
    ...ABILITY_KEYS.map((key) => ({
      label: ABILITY_LABELS[key].name,
      value: key,
    })),
  ];

  const levelOptions = range(SPELL_LEVEL.max + 1).map((level) => ({
    label: level ? String(level) : SPELL_LEVEL_TITLE,
    value: level,
  }));

  const saveDcLabel = computed(() => {
    const value = stats.value.spellSaveDc;

    return value === null ? SHEET_LABELS.noValue : String(value);
  });

  const attackLabel = computed(() => {
    const value = stats.value.spellAttack;

    return value === null ? SHEET_LABELS.noValue : formatModifier(value);
  });

  const preparedLimit = computed(() => {
    const ability = document.value.spellcastingAbility;

    return getPreparedLimit(
      document.value,
      preparedClasses.value,
      ability ? stats.value.abilities[ability] : null,
    );
  });

  const preparedLabel = computed(() => {
    const limit = preparedLimit.value;

    return `${limit.isKnown ? PREPARED_TEXT.known : PREPARED_TEXT.limit}: ${limit.prepared} / ${limit.value ?? SHEET_LABELS.noValue}`;
  });

  const preparedClass = computed(() =>
    preparedLimit.value.value !== null
    && preparedLimit.value.prepared > preparedLimit.value.value
      ? 'text-error'
      : 'text-highlighted',
  );

  const isPreparedAuto = computed(
    () => document.value.preparedLimitOverride === null,
  );

  /**
   * Предел подготовленных: по классам или свой.
   * @param isAuto - считать по классам
   */
  function setPreparedAuto(isAuto: boolean | 'indeterminate'): void {
    update((current) => ({
      ...current,
      preparedLimitOverride:
        isAuto === true ? null : (preparedLimit.value.value ?? 0),
    }));
  }

  /**
   * Свой предел подготовленных заклинаний.
   * @param value - предел
   */
  function setPreparedOverride(value: number | null): void {
    update((current) => ({
      ...current,
      preparedLimitOverride: Math.max(0, value ?? 0),
    }));
  }

  const slotRows = computed(() => {
    const maxima = getSpellSlotsMax(progressions.value);

    return maxima.flatMap((max, index) =>
      max
        ? [
            {
              level: index + 1,
              max,
              used: Math.min(document.value.spellSlotsUsed[index] ?? 0, max),
            },
          ]
        : [],
    );
  });

  const pact = computed(() => getCharacterPactMagic(progressions.value));

  const pactUsed = computed(() =>
    pact.value ? Math.min(document.value.pactSlotsUsed, pact.value.slots) : 0,
  );

  const spellGroups = computed(() =>
    levelOptions
      .map((option) => ({
        level: option.value,
        title: option.value
          ? `${option.value} ${SHEET_LABELS.spellCircle}`
          : SPELL_LEVEL_TITLE,
        spells: document.value.spells.filter(
          (spell) => spell.level === option.value,
        ),
      }))
      .filter((group) => group.spells.length),
  );

  /**
   * Базовая характеристика заклинаний.
   * @param value - выбранное значение
   */
  function setAbility(value: string): void {
    update((current) => ({
      ...current,
      spellcastingAbility: toAbilityKey(value),
    }));
  }

  /**
   * Отмечает трату ячейки: клик по отмеченной снимает отметку.
   * @param level - круг ячейки
   * @param index - номер ячейки
   */
  function toggleSlot(level: number, index: number): void {
    update((current) => ({
      ...current,
      spellSlotsUsed: current.spellSlotsUsed.map((used, slotIndex) => {
        if (slotIndex !== level - 1) {
          return used;
        }

        return used === index + 1 ? index : index + 1;
      }),
    }));
  }

  /**
   * Отмечает трату ячейки договора.
   * @param index - номер ячейки
   */
  function togglePactSlot(index: number): void {
    update((current) => ({
      ...current,
      pactSlotsUsed: current.pactSlotsUsed === index + 1 ? index : index + 1,
    }));
  }

  /**
   * Класс клетки ячейки.
   * @param used - потрачено ячеек
   * @param index - номер ячейки
   */
  function getSlotClass(used: number, index: number): string {
    return index < used ? 'border-primary bg-primary' : 'border-default';
  }

  /**
   * Меняет заклинание.
   * @param id - идентификатор заклинания
   * @param patch - изменённые поля
   */
  function patchSpell(id: string, patch: Partial<SheetSpell>): void {
    update((current) => ({
      ...current,
      spells: current.spells.map((spell) =>
        spell.id === id ? { ...spell, ...patch } : spell,
      ),
    }));
  }

  /**
   * Убирает заклинание.
   * @param id - идентификатор заклинания
   */
  function removeSpell(id: string): void {
    update((current) => ({
      ...current,
      spells: current.spells.filter((spell) => spell.id !== id),
    }));
  }

  /**
   * Добавляет заклинание из справочника.
   * @param option - выбранная запись
   */
  async function addFromCatalog(option: CatalogOption): Promise<void> {
    try {
      const spell = await loadCatalogSpell(option);

      update((current) => ({ ...current, spells: [...current.spells, spell] }));
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  function addCustom(): void {
    update((current) => ({
      ...current,
      spells: [...current.spells, createSheetSpell(SHEET_LABELS.spell, null)],
    }));
  }

  function openPicker(): void {
    isPickerOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <SheetPanel>
      <div class="grid grid-cols-3 gap-2">
        <UFormField :label="SHEET_LABELS.spellcastingAbility">
          <USelect
            :model-value="document.spellcastingAbility ?? NO_ABILITY"
            :items="abilityOptions"
            class="w-full"
            @update:model-value="setAbility"
          />
        </UFormField>

        <div class="flex flex-col items-center justify-center">
          <span class="text-xs text-muted uppercase">{{
            SHEET_LABELS.spellSaveDc
          }}</span>

          <span class="text-2xl font-semibold text-highlighted">{{
            saveDcLabel
          }}</span>
        </div>

        <div class="flex flex-col items-center justify-center">
          <span class="text-xs text-muted uppercase">{{
            SHEET_LABELS.spellAttack
          }}</span>

          <span class="text-2xl font-semibold text-highlighted">{{
            attackLabel
          }}</span>
        </div>
      </div>

      <div
        v-if="slotRows.length || pact"
        class="flex flex-wrap gap-x-6 gap-y-2"
      >
        <div
          v-for="row in slotRows"
          :key="row.level"
          class="flex items-center gap-1"
        >
          <span class="mr-1 text-sm text-muted">{{ row.level }}:</span>

          <button
            v-for="index in row.max"
            :key="index"
            type="button"
            class="size-4 rounded-sm border-2"
            :class="getSlotClass(row.used, index - 1)"
            :aria-label="SHEET_LABELS.spellSlots"
            @click.left.exact.prevent="toggleSlot(row.level, index - 1)"
          />
        </div>

        <div
          v-if="pact"
          class="flex items-center gap-1"
        >
          <span class="mr-1 text-sm text-muted">
            {{ SHEET_LABELS.pactSlots }} ({{ pact.level }}):
          </span>

          <button
            v-for="index in pact.slots"
            :key="index"
            type="button"
            class="size-4 rounded-full border-2"
            :class="getSlotClass(pactUsed, index - 1)"
            :aria-label="SHEET_LABELS.pactSlots"
            @click.left.exact.prevent="togglePactSlot(index - 1)"
          />
        </div>
      </div>
    </SheetPanel>

    <UPopover>
      <button
        type="button"
        :class="SHEET_HEADER_STAT_CLASS"
        class="self-start"
        :aria-label="PREPARED_TEXT.hint"
      >
        <span
          class="text-xs font-bold whitespace-nowrap"
          :class="preparedClass"
        >
          {{ preparedLabel }}
        </span>
      </button>

      <template #content>
        <div class="flex w-64 flex-col gap-3 p-3">
          <UCheckbox
            :model-value="isPreparedAuto"
            :label="PREPARED_TEXT.auto"
            @update:model-value="setPreparedAuto"
          />

          <UFormField
            v-if="!isPreparedAuto"
            :label="PREPARED_TEXT.override"
          >
            <UInputNumber
              :model-value="document.preparedLimitOverride ?? 0"
              :min="0"
              class="w-full"
              @update:model-value="setPreparedOverride"
            />
          </UFormField>
        </div>
      </template>
    </UPopover>

    <SheetPanel
      :title="SHEET_LABELS.spell"
      persistent-actions
    >
      <template #title-actions>
        <UButton
          :label="SHEET_LABELS.addFromCatalog"
          :icon="SHEET_ICON.catalog"
          color="neutral"
          variant="subtle"
          size="xs"
          @click.left.exact.prevent="openPicker"
        />

        <UButton
          :label="SHEET_LABELS.addCustom"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="subtle"
          size="xs"
          @click.left.exact.prevent="addCustom"
        />
      </template>

      <div
        v-for="group in spellGroups"
        :key="group.level"
        class="flex flex-col gap-1"
      >
        <span class="text-xs text-muted uppercase">{{ group.title }}</span>

        <ul class="flex flex-col">
          <li
            v-for="spell in group.spells"
            :key="spell.id"
            class="flex items-center gap-2 border-b border-default py-1 last:border-0"
          >
            <UTooltip :text="SHEET_LABELS.prepared">
              <UCheckbox
                :model-value="spell.isPrepared || spell.alwaysPrepared"
                :disabled="spell.alwaysPrepared"
                :aria-label="SHEET_LABELS.prepared"
                @update:model-value="
                  patchSpell(spell.id, { isPrepared: $event === true })
                "
              />
            </UTooltip>

            <NuxtLink
              v-if="spell.url"
              :to="spell.url"
              target="_blank"
              class="min-w-0 flex-1 truncate text-link hover:underline"
            >
              {{ spell.name }}
            </NuxtLink>

            <template v-else>
              <UInput
                :model-value="spell.name"
                size="xs"
                class="min-w-0 flex-1"
                @update:model-value="
                  patchSpell(spell.id, { name: String($event) })
                "
              />

              <USelect
                :model-value="spell.level"
                :items="levelOptions"
                size="xs"
                class="w-28"
                @update:model-value="patchSpell(spell.id, { level: $event })"
              />
            </template>

            <UBadge
              v-if="spell.isConcentration"
              :label="SHEET_LABELS.concentrationShort"
              :title="SHEET_LABELS.concentration"
              color="neutral"
              variant="subtle"
              size="sm"
            />

            <UBadge
              v-if="spell.isRitual"
              :label="SHEET_LABELS.ritualShort"
              :title="SHEET_LABELS.ritual"
              color="neutral"
              variant="subtle"
              size="sm"
            />

            <span class="hidden text-xs text-muted sm:inline">{{
              spell.school
            }}</span>

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="SHEET_LABELS.remove"
              color="error"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="removeSpell(spell.id)"
            />
          </li>
        </ul>
      </div>

      <p
        v-if="!document.spells.length"
        class="text-sm text-muted"
      >
        {{ SHEET_LABELS.emptySpells }}
      </p>
    </SheetPanel>

    <SheetCatalogPicker
      v-model:open="isPickerOpen"
      :title="SHEET_LABELS.spell"
      :source="SPELL_SEARCH"
      @pick="addFromCatalog"
    />
  </div>
</template>
