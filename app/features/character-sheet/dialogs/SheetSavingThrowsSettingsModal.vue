<script setup lang="ts">
  import type { AbilityKey, CustomBonus, SavingThrowDraft } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    createCustomBonus,
    createSheetElementId,
    formatModifier,
    getSavingThrowBase,
    getSavingThrowDrafts,
    PROFICIENCY_DOT_ICONS,
    SAVING_THROW_SETTINGS_TEXT,
  } from '../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /**
   * Настройка спасбросков, как на new.ttg.club: владение, характеристика
   * спасброска (её можно подменить), бонусы отдельного спасброска и общие ко
   * всем шести. Правки копятся в черновике и уходят в лист по «Применить»;
   * итоги пересчитываются сразу.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const drafts = ref<Array<SavingThrowDraft>>([]);
  const commonBonuses = ref<Array<CustomBonus>>([]);

  const abilityItems = ABILITY_KEYS.map((key) => ({
    value: key,
    label: ABILITY_LABELS[key].name,
  }));

  // Черновик снимается с листа при каждом открытии окна
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    drafts.value = getSavingThrowDrafts(document.value);

    commonBonuses.value = document.value.savingThrowCommonBonuses.map(
      (bonus) => ({ ...bonus }),
    );
  });

  const bonusContext = computed(() => stats.value.bonusContext);

  /** Сохранённые настройки: от них итог листа отличается на эффекты. */
  const savedDrafts = computed(() => getSavingThrowDrafts(document.value));

  /**
   * Итог спасброска по черновику. Итог листа уже включает эффекты: в нём
   * подменяется только записанная часть на черновую.
   * @param draft - настройка спасброска
   */
  function getDraftValue(draft: SavingThrowDraft): number {
    const saved = savedDrafts.value.find((entry) => entry.key === draft.key);

    const savedBase = saved
      ? getSavingThrowBase(
          saved,
          document.value.savingThrowCommonBonuses,
          bonusContext.value,
        )
      : 0;

    return (
      stats.value.savingThrows[draft.key].bonus
      - savedBase
      + getSavingThrowBase(draft, commonBonuses.value, bonusContext.value)
    );
  }

  const rows = computed(() =>
    drafts.value.map((draft) => {
      const isChanged = draft.ability !== draft.key || draft.bonuses.length > 0;

      return {
        draft,
        label: ABILITY_LABELS[draft.key].name,
        icon: draft.isProficient
          ? PROFICIENCY_DOT_ICONS.proficient
          : PROFICIENCY_DOT_ICONS.none,
        iconClass: draft.isProficient ? 'text-primary' : 'text-muted',
        proficiencyLabel: draft.isProficient
          ? SAVING_THROW_SETTINGS_TEXT.proficient
          : SAVING_THROW_SETTINGS_TEXT.notProficient,
        formattedValue: formatModifier(getDraftValue(draft)),
        isChanged,
        frameClass: isChanged ? 'border-primary/40' : 'border-default/50',
      };
    }),
  );

  /**
   * Переключает владение — как точкой в блоке спасбросков.
   * @param draft - настройка спасброска
   */
  function toggleProficiency(draft: SavingThrowDraft): void {
    draft.isProficient = !draft.isProficient;
  }

  /**
   * Возвращает спасбросок к правилам: своя характеристика, без бонусов.
   * Владение остаётся — его даёт класс, а не подсчёт.
   * @param draft - настройка спасброска
   */
  function resetSavingThrow(draft: SavingThrowDraft): void {
    draft.ability = draft.key;
    draft.bonuses = [];
  }

  /**
   * Добавляет спасброску бонус «+1»: он правится тут же в строке.
   * @param draft - настройка спасброска
   */
  function addBonus(draft: SavingThrowDraft): void {
    draft.bonuses = [
      ...draft.bonuses,
      createCustomBonus(createSheetElementId()),
    ];
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
    const savingThrows: Array<AbilityKey> = [];
    const savingThrowAbilities: Partial<Record<AbilityKey, AbilityKey>> = {};

    const savingThrowBonuses: Partial<Record<AbilityKey, Array<CustomBonus>>> =
      {};

    for (const draft of drafts.value) {
      if (draft.isProficient) {
        savingThrows.push(draft.key);
      }

      if (draft.ability !== draft.key) {
        savingThrowAbilities[draft.key] = draft.ability;
      }

      if (draft.bonuses.length) {
        savingThrowBonuses[draft.key] = toStoredBonuses(draft.bonuses);
      }
    }

    const savingThrowCommonBonuses = toStoredBonuses(commonBonuses.value);

    update((current) => ({
      ...current,
      savingThrows,
      savingThrowAbilities,
      savingThrowBonuses,
      savingThrowCommonBonuses,
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
    :title="SAVING_THROW_SETTINGS_TEXT.title"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SAVING_THROW_SETTINGS_TEXT.hint }}
        </p>

        <!-- Общие бонусы разделом, а не карточкой: своя рамка спорила бы с
          пунктиром кнопки «Добавить бонус» внутри него -->
        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SAVING_THROW_SETTINGS_TEXT.commonTitle }}
          </span>

          <SheetCustomBonusRows
            v-model="commonBonuses"
            :classes="document.classes"
            :context="bonusContext"
          />

          <p class="text-xs text-dimmed">
            {{ SAVING_THROW_SETTINGS_TEXT.commonHint }}
          </p>
        </div>

        <USeparator />

        <div
          v-for="row in rows"
          :key="row.draft.key"
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
                :aria-label="`${SAVING_THROW_SETTINGS_TEXT.proficiency}: ${row.label}`"
                @click.left.exact.prevent="toggleProficiency(row.draft)"
              >
                <UIcon
                  :name="row.icon"
                  class="size-4 shrink-0 transition-colors hover:text-primary"
                  :class="row.iconClass"
                />
              </button>
            </UTooltip>

            <span class="min-w-0 grow truncate text-sm text-toned">
              {{ row.label }}
            </span>

            <span
              class="w-8 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
            >
              {{ row.formattedValue }}
            </span>

            <!-- Отдельная группа: на узком окне она переносится под
              название целой строкой -->
            <div class="flex w-full items-center gap-2 sm:w-auto">
              <USelect
                v-model="row.draft.ability"
                :items="abilityItems"
                size="sm"
                class="min-w-0 grow sm:w-40 sm:grow-0"
                :aria-label="`${SAVING_THROW_SETTINGS_TEXT.abilityPlaceholder}: ${row.label}`"
              />

              <UTooltip :text="SAVING_THROW_SETTINGS_TEXT.resetSavingThrow">
                <UButton
                  icon="tabler:rotate"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  :disabled="!row.isChanged"
                  :aria-label="`${SAVING_THROW_SETTINGS_TEXT.resetSavingThrow}: ${row.label}`"
                  @click.left.exact.prevent="resetSavingThrow(row.draft)"
                />
              </UTooltip>

              <UTooltip :text="SAVING_THROW_SETTINGS_TEXT.addBonus">
                <UButton
                  icon="tabler:plus"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  square
                  :aria-label="`${SAVING_THROW_SETTINGS_TEXT.addBonus}: ${row.label}`"
                  @click.left.exact.prevent="addBonus(row.draft)"
                />
              </UTooltip>
            </div>
          </div>

          <!-- Первый бонус заводит плюс в шапке строки: своя кнопка
            «Добавить» в каждой из шести строк только шумела бы -->
          <SheetCustomBonusRows
            v-if="row.draft.bonuses.length"
            v-model="row.draft.bonuses"
            :classes="document.classes"
            :context="bonusContext"
            :with-add="false"
            class="border-l-2 border-primary/40 pl-2"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SAVING_THROW_SETTINGS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SAVING_THROW_SETTINGS_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
