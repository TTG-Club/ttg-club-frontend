<script setup lang="ts">
  import type { CatalogOption } from '../model';

  import { uniq } from 'es-toolkit';

  import { getApiErrorMessage } from '~user/model';

  import { useCharacterSheet } from '../composables';
  import { SheetCatalogPicker, SheetClassesModal } from '../dialogs';
  import {
    applyLongRest,
    applyShortRest,
    BACKGROUND_SEARCH,
    CHARACTER_SHEET_ROUTE,
    getCharacterLevel,
    getClassesLabel,
    getNextLevelExperience,
    loadBackgroundSelection,
    loadRaceSelection,
    RACE_SEARCH,
    replaceRaceBonuses,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_SAVE_STATUS_ICON,
    SHEET_SAVE_STATUS_TEXT,
    SHEET_TEXT,
  } from '../model';

  /**
   * Шапка листа: имя, раса, предыстория, классы, опыт, вдохновение, отдых и
   * состояние сохранения.
   */
  const LANGUAGES_SEPARATOR = ', ';

  const toast = useToast();

  const { name, document, saveStatus, update, rename, reload } =
    useCharacterSheet();

  const isRacePickerOpen = ref(false);
  const isBackgroundPickerOpen = ref(false);
  const isClassesOpen = ref(false);

  const level = computed(() => getCharacterLevel(document.value.classes));

  const classesLabel = computed(() => getClassesLabel(document.value.classes));

  const nextLevelExperience = computed(() =>
    getNextLevelExperience(level.value),
  );

  const experienceHint = computed(() =>
    nextLevelExperience.value === null
      ? ''
      : `${nextLevelExperience.value} ${SHEET_LABELS.nextLevel}`,
  );

  const saveStatusText = computed(
    () => SHEET_SAVE_STATUS_TEXT[saveStatus.value],
  );

  const saveStatusIcon = computed(
    () => SHEET_SAVE_STATUS_ICON[saveStatus.value],
  );

  const saveStatusClass = computed(() => {
    if (saveStatus.value === 'conflict' || saveStatus.value === 'error') {
      return 'text-error';
    }

    return saveStatus.value === 'saving'
      ? 'animate-spin text-muted'
      : 'text-muted';
  });

  const conflictActions = [{ label: SHEET_TEXT.reload, onClick: reload }];

  const inspirationIcon = computed(() =>
    document.value.inspiration
      ? SHEET_ICON.inspirationActive
      : SHEET_ICON.inspiration,
  );

  const inspirationColor = computed(() =>
    document.value.inspiration ? 'primary' : 'neutral',
  );

  /**
   * Меняет имя персонажа.
   * @param value - новое имя
   */
  function setName(value: string | number): void {
    rename(String(value));
  }

  /**
   * Меняет мировоззрение.
   * @param value - новое значение
   */
  function setAlignment(value: string | number): void {
    update((current) => ({ ...current, alignment: String(value) }));
  }

  /**
   * Меняет опыт.
   * @param value - очки опыта
   */
  function setExperience(value: number | null): void {
    update((current) => ({ ...current, experience: Math.max(0, value ?? 0) }));
  }

  function toggleInspiration(): void {
    update((current) => ({ ...current, inspiration: !current.inspiration }));
  }

  function shortRest(): void {
    update(applyShortRest);
  }

  function longRest(): void {
    update(applyLongRest);
  }

  /**
   * Ставит расу: бонусы прежней расы снимаются, новые прибавляются.
   * @param option - выбранная раса
   */
  async function pickRace(option: CatalogOption): Promise<void> {
    try {
      const selection = await loadRaceSelection(option);

      update((current) => ({
        ...current,
        race: selection.race,
        raceAbilityBonuses: selection.bonuses,
        abilities: replaceRaceBonuses(
          current.abilities,
          current.raceAbilityBonuses,
          selection.bonuses,
        ),
        speed: selection.speed ?? current.speed,
        darkvision: selection.darkvision ?? current.darkvision,
      }));
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  function clearRace(): void {
    update((current) => ({
      ...current,
      race: null,
      raceAbilityBonuses: {},
      abilities: replaceRaceBonuses(
        current.abilities,
        current.raceAbilityBonuses,
        {},
      ),
    }));
  }

  /**
   * Ставит предысторию: её навыки отмечаются владением, языки дописываются.
   * @param option - выбранная предыстория
   */
  async function pickBackground(option: CatalogOption): Promise<void> {
    try {
      const selection = await loadBackgroundSelection(option);

      update((current) => {
        const skills = { ...current.skills };

        for (const skill of selection.skills) {
          if ((skills[skill] ?? 'none') === 'none') {
            skills[skill] = 'proficient';
          }
        }

        const languages = uniq([
          ...current.proficiencies.languages
            .split(LANGUAGES_SEPARATOR)
            .map((language) => language.trim())
            .filter(Boolean),
          ...selection.languages,
        ]).join(LANGUAGES_SEPARATOR);

        return {
          ...current,
          background: selection.background,
          skills,
          proficiencies: { ...current.proficiencies, languages },
        };
      });
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  function clearBackground(): void {
    update((current) => ({ ...current, background: null }));
  }

  function openRacePicker(): void {
    isRacePickerOpen.value = true;
  }

  function openBackgroundPicker(): void {
    isBackgroundPickerOpen.value = true;
  }

  function openClasses(): void {
    isClassesOpen.value = true;
  }
</script>

<template>
  <header class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <UButton
        :to="CHARACTER_SHEET_ROUTE"
        :icon="SHEET_ICON.back"
        :aria-label="SHEET_TEXT.backToList"
        color="neutral"
        variant="ghost"
      />

      <UInput
        :model-value="name"
        :placeholder="SHEET_TEXT.defaultName"
        variant="ghost"
        size="xl"
        class="min-w-0 flex-1"
        :ui="{ base: 'text-2xl font-semibold text-highlighted' }"
        @update:model-value="setName"
      />

      <UTooltip :text="saveStatusText">
        <UIcon
          :name="saveStatusIcon"
          class="size-5 shrink-0"
          :class="saveStatusClass"
        />
      </UTooltip>
    </div>

    <UAlert
      v-if="saveStatus === 'conflict'"
      color="warning"
      variant="subtle"
      :title="SHEET_TEXT.conflict"
      :actions="conflictActions"
    />

    <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
      <UFormField :label="SHEET_LABELS.race">
        <UFieldGroup class="w-full">
          <UButton
            :label="document.race?.name ?? SHEET_LABELS.notSelected"
            color="neutral"
            variant="outline"
            class="min-w-0 flex-1"
            @click.left.exact.prevent="openRacePicker"
          />

          <UButton
            v-if="document.race"
            :icon="SHEET_ICON.close"
            :aria-label="SHEET_LABELS.clear"
            color="neutral"
            variant="outline"
            @click.left.exact.prevent="clearRace"
          />
        </UFieldGroup>
      </UFormField>

      <UFormField :label="SHEET_LABELS.classes">
        <UButton
          :label="classesLabel"
          color="neutral"
          variant="outline"
          block
          @click.left.exact.prevent="openClasses"
        />
      </UFormField>

      <UFormField :label="SHEET_LABELS.background">
        <UFieldGroup class="w-full">
          <UButton
            :label="document.background?.name ?? SHEET_LABELS.notSelected"
            color="neutral"
            variant="outline"
            class="min-w-0 flex-1"
            @click.left.exact.prevent="openBackgroundPicker"
          />

          <UButton
            v-if="document.background"
            :icon="SHEET_ICON.close"
            :aria-label="SHEET_LABELS.clear"
            color="neutral"
            variant="outline"
            @click.left.exact.prevent="clearBackground"
          />
        </UFieldGroup>
      </UFormField>

      <UFormField :label="SHEET_LABELS.alignment">
        <UInput
          :model-value="document.alignment"
          class="w-full"
          @update:model-value="setAlignment"
        />
      </UFormField>

      <UFormField
        :label="SHEET_LABELS.experience"
        :hint="experienceHint"
      >
        <UInputNumber
          :model-value="document.experience"
          :min="0"
          class="w-full"
          @update:model-value="setExperience"
        />
      </UFormField>

      <div class="col-span-1 flex items-end gap-2 md:col-span-3">
        <UButton
          :label="SHEET_LABELS.inspiration"
          :icon="inspirationIcon"
          :color="inspirationColor"
          variant="subtle"
          @click.left.exact.prevent="toggleInspiration"
        />

        <UButton
          :label="SHEET_LABELS.shortRest"
          :icon="SHEET_ICON.shortRest"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="shortRest"
        />

        <UButton
          :label="SHEET_LABELS.longRest"
          :icon="SHEET_ICON.rest"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="longRest"
        />
      </div>
    </div>

    <SheetCatalogPicker
      v-model:open="isRacePickerOpen"
      :title="SHEET_LABELS.race"
      :source="RACE_SEARCH"
      @pick="pickRace"
    />

    <SheetCatalogPicker
      v-model:open="isBackgroundPickerOpen"
      :title="SHEET_LABELS.background"
      :source="BACKGROUND_SEARCH"
      @pick="pickBackground"
    />

    <SheetClassesModal v-model:open="isClassesOpen" />
  </header>
</template>
