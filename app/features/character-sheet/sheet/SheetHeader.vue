<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    CatalogOption,
    SheetDocument,
    SourceKind,
    WIZARD_STEPS,
  } from '../model';

  import { uniq } from 'es-toolkit';

  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useSheetPickers,
    useSheetStats,
  } from '../composables';
  import {
    SheetAbilityScoresModal,
    SheetClassesModal,
    SheetConfirmModal,
    SheetCustomEntryModal,
    SheetExperienceModal,
    SheetLongRestModal,
    SheetSettingsModal,
    SheetShortRestModal,
    SheetSizeModal,
    SheetSourcesReview,
    SheetSourceWizardModal,
    SheetVisionModal,
  } from '../dialogs';
  import {
    addSources,
    BACKGROUND_TREE,
    CATALOG_TREE_TEXT,
    CHARACTER_SHEET_ROUTE,
    createSheet,
    deleteSheet,
    downloadSheetJson,
    getClassesLabel,
    getExperienceProgress,
    getSheetRoute,
    loadBackgroundSources,
    loadRaceSources,
    RACE_TREE,
    removeSources,
    replaceRaceBonuses,
    REST_ICON,
    SHEET_BODY_LABELS,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_MENU_LABELS,
    SHEET_SAVE_STATUS_ICON,
    SHEET_SAVE_STATUS_TEXT,
    SHEET_SIZE_INFO,
    SHEET_SIZE_LABELS,
    SHEET_TEXT,
    SHEET_VISION_LABELS,
    WIZARD_TEXT,
  } from '../model';
  import SheetAvatar from './SheetAvatar.vue';

  /**
   * Шапка листа, как на new.ttg.club: портрет, имя, подпись «Раса — Класс N
   * — Предыстория» (каждая часть открывает свой выбор), полоса опыта до
   * следующего уровня, справа — состояние сохранения, замок, меню и
   * закрытие, вдохновение и отдых. Раса и предыстория выбираются мастером:
   * запись с описанием, затем итог с выдачами и выборами, и только потом
   * лист.
   */
  /** Источники расы: снимаются вместе при смене расы. */
  const RACE_SOURCE_KINDS: ReadonlySet<SourceKind> = new Set([
    'race',
    'subrace',
    'raceFeature',
  ]);

  const toast = useToast();

  const {
    name,
    document,
    saveStatus,
    isLocked,
    update,
    rename,
    reload,
    toggleLock,
    ensureEditable,
    sheetId,
    discardChanges,
  } = useCharacterSheet();

  const { stats } = useSheetStats();

  /** Черновик мастера: лист после выбора и добавленные источники. */
  interface WizardDraft {
    name: string;
    document: SheetDocument;
    sourceIds: Array<string>;
  }

  const isRacePickerOpen = ref(false);
  const isCustomRaceOpen = ref(false);
  const isCustomBackgroundOpen = ref(false);
  const { isBackgroundPickerOpen } = useSheetPickers();

  const raceStep = ref<(typeof WIZARD_STEPS)[number]>('pick');
  const backgroundStep = ref<(typeof WIZARD_STEPS)[number]>('pick');
  const raceDraft = shallowRef<WizardDraft | null>(null);
  const backgroundDraft = shallowRef<WizardDraft | null>(null);
  const isWizardPreparing = ref(false);
  const isClassesOpen = ref(false);
  const isVisionOpen = ref(false);
  const isSizeOpen = ref(false);

  /** Строки подсказки чувств у портрета; пусто — обычное зрение. */
  const visionRows = computed(() =>
    stats.value.senses.map((sense) => ({
      key: sense.key,
      text: `${sense.label} ${sense.range} ${SHEET_VISION_LABELS.unit}`,
    })),
  );

  const sizeLetter = computed(() =>
    document.value.size ? SHEET_SIZE_INFO[document.value.size].letter : null,
  );

  const sizeTooltip = computed(() =>
    document.value.size
      ? `${SHEET_SIZE_LABELS.field}: ${SHEET_SIZE_INFO[document.value.size].name}`
      : SHEET_SIZE_LABELS.empty,
  );

  function openVision(): void {
    if (!ensureEditable()) {
      return;
    }

    isVisionOpen.value = true;
  }

  function openSize(): void {
    if (!ensureEditable()) {
      return;
    }

    isSizeOpen.value = true;
  }

  const isExperienceOpen = ref(false);
  const isShortRestOpen = ref(false);
  const isLongRestOpen = ref(false);

  const level = computed(() => stats.value.level);
  const classLabel = computed(() => getClassesLabel(document.value.classes));

  const raceLabel = computed(
    () => document.value.race?.name ?? SHEET_BODY_LABELS.noRace,
  );

  const backgroundLabel = computed(
    () => document.value.background?.name ?? SHEET_BODY_LABELS.noBackground,
  );

  const experienceProgress = computed(() =>
    getExperienceProgress(document.value.experience, level.value),
  );

  /** Доля пути к следующему уровню, %: полоса делится подписью пополам. */
  const progress = computed(() => experienceProgress.value.percent);

  const leftWidth = computed(() => `${Math.min(100, progress.value * 2)}%`);

  const rightWidth = computed(
    () => `${Math.max(0, progress.value * 2 - 100)}%`,
  );

  const experienceLabel = computed(
    () =>
      `${document.value.experience} / ${experienceProgress.value.to ?? '—'} XP`,
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

  const lockIcon = computed(() =>
    isLocked.value ? 'tabler:lock' : 'tabler:lock-open',
  );

  const lockColor = computed(() => (isLocked.value ? 'primary' : 'neutral'));

  const lockLabel = computed(() =>
    isLocked.value ? SHEET_BODY_LABELS.unlock : SHEET_BODY_LABELS.lock,
  );

  const inspirationVariant = computed(() =>
    document.value.inspiration ? 'solid' : 'outline',
  );

  const isRemoveOpen = ref(false);
  const isMenuBusy = ref(false);
  const isSettingsOpen = ref(false);
  const isAbilityScoresOpen = ref(false);

  function openAbilityScores(): void {
    if (!ensureEditable()) {
      return;
    }

    isAbilityScoresOpen.value = true;
  }

  function openSettings(): void {
    if (!ensureEditable()) {
      return;
    }

    isSettingsOpen.value = true;
  }

  function downloadJson(): void {
    downloadSheetJson({ name: name.value, data: document.value });
  }

  /** Копия листа с текущими правками; открывается сразу. */
  async function copySheet(): Promise<void> {
    isMenuBusy.value = true;

    try {
      const created = await createSheet(
        `${name.value}${SHEET_TEXT.copySuffix}`,
        document.value,
      );

      await navigateTo(getSheetRoute(created.id));
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorCopy),
        color: 'error',
      });
    } finally {
      isMenuBusy.value = false;
    }
  }

  function askRemove(): void {
    if (!ensureEditable()) {
      return;
    }

    isRemoveOpen.value = true;
  }

  /** Удаляет лист и возвращает к списку; несохранённое уже не нужно. */
  async function removeSheet(): Promise<void> {
    const id = sheetId.value;

    if (!id) {
      return;
    }

    try {
      await deleteSheet(id);
      discardChanges();
      await navigateTo(CHARACTER_SHEET_ROUTE);
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorDelete),
        color: 'error',
      });
    }
  }

  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      {
        label: SHEET_MENU_LABELS.backToList,
        icon: SHEET_ICON.back,
        to: CHARACTER_SHEET_ROUTE,
      },
      {
        label: SHEET_MENU_LABELS.reload,
        icon: 'tabler:refresh',
        onSelect: reload,
      },
    ],
    [
      {
        label: SHEET_MENU_LABELS.settings,
        icon: 'tabler:adjustments',
        onSelect: openSettings,
      },
      {
        label: SHEET_MENU_LABELS.abilityScores,
        icon: 'tabler:calculator',
        onSelect: openAbilityScores,
      },
    ],
    [
      {
        label: SHEET_MENU_LABELS.downloadJson,
        icon: 'tabler:file-download',
        onSelect: downloadJson,
      },
      {
        label: SHEET_MENU_LABELS.copy,
        icon: 'tabler:copy',
        disabled: isMenuBusy.value,
        onSelect: copySheet,
      },
    ],
    [
      {
        label: SHEET_MENU_LABELS.remove,
        icon: 'tabler:trash',
        color: 'error',
        onSelect: askRemove,
      },
    ],
  ]);

  /**
   * Имя персонажа.
   * @param value - новое имя
   */
  function setName(value: string | number): void {
    rename(String(value));
  }

  function toggleInspiration(): void {
    update((current) => ({ ...current, inspiration: !current.inspiration }));
  }

  /**
   * Лист без расы: источники расы снимаются, прежние бонусы листа до
   * механики возвращаются.
   * @param current - лист персонажа
   */
  function stripRace(current: SheetDocument): SheetDocument {
    const stripped = removeSources(
      current,
      current.sources
        .filter((source) => RACE_SOURCE_KINDS.has(source.kind))
        .map((source) => source.id),
    );

    return {
      ...stripped,
      race: null,
      abilities: replaceRaceBonuses(
        stripped.abilities,
        stripped.raceAbilityBonuses,
        {},
      ),
      raceAbilityBonuses: {},
    };
  }

  /**
   * Лист без предыстории: её источник снимается со всеми выдачами.
   * @param current - лист персонажа
   */
  function stripBackground(current: SheetDocument): SheetDocument {
    return {
      ...removeSources(
        current,
        current.sources
          .filter((source) => source.kind === 'background')
          .map((source) => source.id),
      ),
      background: null,
    };
  }

  /**
   * Готовит итог мастера расы: прежняя раса снимается со всеми выдачами,
   * новая применяется к черновику через механику (повышения, чувства,
   * скорости, владения), выборы делаются на шаге итога.
   * @param option - выбранная раса
   */
  async function prepareRace(option: CatalogOption): Promise<void> {
    isWizardPreparing.value = true;

    try {
      const result = await loadRaceSources(option, level.value);
      const current = document.value;

      raceDraft.value = {
        name: option.caption
          ? `${option.caption}: ${option.name}`
          : option.name,
        document: addSources(
          {
            ...stripRace(current),
            race: result.race,
            speed: result.speed ?? current.speed,
            size: result.size ?? current.size,
          },
          result.sources,
        ),
        sourceIds: result.sources.map((source) => source.id),
      };

      raceStep.value = 'review';
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    } finally {
      isWizardPreparing.value = false;
    }
  }

  /**
   * Черновик мастера расы после ответа на выбор.
   * @param next - новый черновик
   */
  function setRaceDraft(next: SheetDocument): void {
    if (raceDraft.value) {
      raceDraft.value = { ...raceDraft.value, document: next };
    }
  }

  /** Переносит черновик мастера расы в лист. */
  function applyRace(): void {
    const draft = raceDraft.value;

    if (draft) {
      update(() => draft.document);
    }

    isRacePickerOpen.value = false;
    raceDraft.value = null;
  }

  function clearRace(): void {
    if (!ensureEditable()) {
      return;
    }

    update(stripRace);
  }

  function openCustomRace(): void {
    if (!ensureEditable()) {
      return;
    }

    isCustomRaceOpen.value = true;
  }

  /**
   * Ставит свою расу: прежняя снимается, новая — только название, без
   * механики справочника.
   * @param raceName - название расы
   */
  function pickCustomRace(raceName: string): void {
    update((current) => ({
      ...stripRace(current),
      race: { name: raceName, url: null },
    }));
  }

  /**
   * Готовит итог мастера предыстории: прежняя снимается, новая выдаёт навыки
   * (из механики или по названиям), владения и выборы; языки без механики
   * дописываются списком, как раньше.
   * @param option - выбранная предыстория
   */
  async function prepareBackground(option: CatalogOption): Promise<void> {
    isWizardPreparing.value = true;

    try {
      const result = await loadBackgroundSources(option, level.value);
      const stripped = stripBackground(document.value);

      const languages = uniq([
        ...stripped.proficiencies.languages,
        ...result.languages,
      ]);

      backgroundDraft.value = {
        name: option.name,
        document: addSources(
          {
            ...stripped,
            background: result.background,
            proficiencies: { ...stripped.proficiencies, languages },
          },
          [result.source],
        ),
        sourceIds: [result.source.id],
      };

      backgroundStep.value = 'review';
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    } finally {
      isWizardPreparing.value = false;
    }
  }

  /**
   * Черновик мастера предыстории после ответа на выбор.
   * @param next - новый черновик
   */
  function setBackgroundDraft(next: SheetDocument): void {
    if (backgroundDraft.value) {
      backgroundDraft.value = { ...backgroundDraft.value, document: next };
    }
  }

  /** Переносит черновик мастера предыстории в лист. */
  function applyBackground(): void {
    const draft = backgroundDraft.value;

    if (draft) {
      update(() => draft.document);
    }

    isBackgroundPickerOpen.value = false;
    backgroundDraft.value = null;
  }

  function openCustomBackground(): void {
    isCustomBackgroundOpen.value = true;
  }

  /**
   * Ставит свою предысторию: прежняя снимается, новая — только название.
   * @param backgroundName - название предыстории
   */
  function pickCustomBackground(backgroundName: string): void {
    update((current) => ({
      ...stripBackground(current),
      background: { name: backgroundName, url: null },
    }));
  }

  function clearBackground(): void {
    if (!ensureEditable()) {
      return;
    }

    update(stripBackground);
  }

  function openRacePicker(): void {
    if (!ensureEditable()) {
      return;
    }

    isRacePickerOpen.value = true;
  }

  function openBackgroundPicker(): void {
    if (!ensureEditable()) {
      return;
    }

    isBackgroundPickerOpen.value = true;
  }

  function openClasses(): void {
    if (!ensureEditable()) {
      return;
    }

    isClassesOpen.value = true;
  }

  function openExperience(): void {
    isExperienceOpen.value = true;
  }

  function openShortRest(): void {
    isShortRestOpen.value = true;
  }

  function openLongRest(): void {
    isLongRestOpen.value = true;
  }
</script>

<template>
  <header
    class="@container flex flex-col items-center gap-4 @2xl:flex-row @2xl:items-start @2xl:gap-6"
  >
    <div class="relative mb-2 shrink-0 @2xl:mb-0">
      <SheetAvatar />

      <div
        class="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1"
      >
        <UTooltip :text="SHEET_VISION_LABELS.normal">
          <!-- Непрозрачная подложка: soft-кнопка полупрозрачная, без неё
            сквозь неё просвечивает край портрета -->
          <span class="rounded-full bg-default">
            <UButton
              icon="tabler:eye"
              color="primary"
              variant="soft"
              size="xs"
              square
              class="rounded-full"
              :aria-label="SHEET_VISION_LABELS.open"
              @click.left.exact.prevent="openVision"
            />
          </span>

          <template
            v-if="visionRows.length"
            #content
          >
            <div class="flex flex-col gap-1 p-1">
              <span
                v-for="row in visionRows"
                :key="row.key"
                class="text-xs text-highlighted"
              >
                {{ row.text }}
              </span>
            </div>
          </template>
        </UTooltip>

        <UTooltip :text="sizeTooltip">
          <span class="rounded-full bg-default">
            <UButton
              color="primary"
              variant="soft"
              size="xs"
              square
              class="rounded-full"
              :aria-label="SHEET_SIZE_LABELS.open"
              @click.left.exact.prevent="openSize"
            >
              <span
                v-if="sizeLetter"
                class="w-4 text-center text-xs font-bold"
              >
                {{ sizeLetter }}
              </span>

              <UIcon
                v-else
                name="tabler:ruler-2"
                class="size-4"
              />
            </UButton>
          </span>
        </UTooltip>
      </div>
    </div>

    <div class="flex w-full min-w-0 grow flex-col gap-1 @2xl:w-auto">
      <UPopover :disabled="isLocked">
        <button
          type="button"
          class="max-w-full cursor-pointer truncate text-center text-3xl font-bold tracking-wide text-highlighted transition-colors hover:text-primary @2xl:max-w-fit @2xl:text-left"
          :aria-label="SHEET_BODY_LABELS.name"
        >
          {{ name || SHEET_TEXT.defaultName }}
        </button>

        <template #content>
          <div class="flex w-72 flex-col gap-3 p-3">
            <UFormField :label="SHEET_LABELS.name">
              <UInput
                :model-value="name"
                :placeholder="SHEET_TEXT.defaultName"
                autofocus
                class="w-full"
                @update:model-value="setName"
              />
            </UFormField>
          </div>
        </template>
      </UPopover>

      <span
        class="flex min-w-0 flex-wrap items-center justify-center gap-1 text-sm text-muted italic @2xl:justify-start"
      >
        <UFieldGroup>
          <button
            type="button"
            class="cursor-pointer rounded px-1 transition-colors hover:bg-elevated/60 hover:text-primary"
            :aria-label="SHEET_LABELS.race"
            @click.left.exact.prevent="openRacePicker"
          >
            {{ raceLabel }}
          </button>

          <button
            v-if="document.race"
            type="button"
            class="cursor-pointer rounded px-0.5 text-dimmed hover:text-error"
            :aria-label="SHEET_LABELS.clear"
            @click.left.exact.prevent="clearRace"
          >
            <UIcon
              :name="SHEET_ICON.close"
              class="size-3"
            />
          </button>
        </UFieldGroup>

        <span>—</span>

        <button
          type="button"
          class="cursor-pointer rounded px-1 transition-colors hover:bg-elevated/60 hover:text-primary"
          :aria-label="SHEET_LABELS.classes"
          @click.left.exact.prevent="openClasses"
        >
          {{ classLabel }}
        </button>

        <span>—</span>

        <UFieldGroup>
          <button
            type="button"
            class="cursor-pointer truncate rounded px-1 transition-colors hover:bg-elevated/60 hover:text-primary"
            :aria-label="SHEET_LABELS.background"
            @click.left.exact.prevent="openBackgroundPicker"
          >
            {{ backgroundLabel }}
          </button>

          <button
            v-if="document.background"
            type="button"
            class="cursor-pointer rounded px-0.5 text-dimmed hover:text-error"
            :aria-label="SHEET_LABELS.clear"
            @click.left.exact.prevent="clearBackground"
          >
            <UIcon
              :name="SHEET_ICON.close"
              class="size-3"
            />
          </button>
        </UFieldGroup>
      </span>

      <button
        type="button"
        class="mt-2 flex w-full cursor-pointer items-center gap-3 rounded p-1 text-xs text-toned transition-colors hover:bg-elevated/40 @5xl:max-w-lg"
        :aria-label="SHEET_BODY_LABELS.experience"
        @click.left.exact.prevent="openExperience"
      >
        <span class="shrink-0">
          <span class="hidden @5xl:inline"
            >{{ SHEET_BODY_LABELS.levelPrefix }}&nbsp;</span
          >{{ level }}
        </span>

        <span class="flex grow items-center gap-2">
          <span class="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
            <span
              class="block h-full rounded-full bg-linear-to-r from-primary/50 to-primary transition-[width] duration-300"
              :style="{ width: leftWidth }"
            />
          </span>

          <span
            class="text-[10px] leading-none font-medium tracking-widest whitespace-nowrap text-dimmed"
          >
            {{ experienceLabel }}
          </span>

          <span class="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
            <span
              class="block h-full rounded-full bg-primary transition-[width] duration-300"
              :style="{ width: rightWidth }"
            />
          </span>
        </span>

        <span class="shrink-0">
          <span class="hidden @5xl:inline"
            >{{ SHEET_BODY_LABELS.levelPrefix }}&nbsp;</span
          >{{ level + 1 }}
        </span>
      </button>
    </div>

    <div
      class="order-first flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-3 @2xl:order-0 @2xl:w-auto @2xl:flex-col @2xl:flex-nowrap @2xl:items-end @2xl:justify-start @2xl:gap-4 @2xl:self-stretch"
    >
      <div class="flex items-center gap-1">
        <UTooltip :text="saveStatusText">
          <span
            role="status"
            class="grid size-8 place-items-center"
            :aria-label="saveStatusText"
          >
            <UIcon
              :name="saveStatusIcon"
              class="size-5"
              :class="saveStatusClass"
            />
          </span>
        </UTooltip>

        <UTooltip :text="lockLabel">
          <UButton
            :icon="lockIcon"
            :color="lockColor"
            variant="ghost"
            square
            :aria-label="lockLabel"
            @click.left.exact.prevent="toggleLock"
          />
        </UTooltip>

        <UDropdownMenu :items="menuItems">
          <UButton
            icon="tabler:dots-vertical"
            color="neutral"
            variant="ghost"
            square
            :aria-label="SHEET_BODY_LABELS.menu"
          />
        </UDropdownMenu>

        <UTooltip :text="SHEET_BODY_LABELS.close">
          <UButton
            :icon="SHEET_ICON.close"
            :to="CHARACTER_SHEET_ROUTE"
            color="neutral"
            variant="ghost"
            square
            :aria-label="SHEET_BODY_LABELS.close"
          />
        </UTooltip>
      </div>

      <div class="flex items-center gap-2 @max-2xl:order-first">
        <UButton
          icon="tabler:sparkles"
          :label="SHEET_BODY_LABELS.inspiration"
          color="primary"
          :variant="inspirationVariant"
          :aria-pressed="document.inspiration"
          @click.left.exact.prevent="toggleInspiration"
        />

        <UTooltip :text="SHEET_LABELS.shortRest">
          <UButton
            :icon="REST_ICON.short"
            color="neutral"
            variant="ghost"
            square
            :aria-label="SHEET_LABELS.shortRest"
            @click.left.exact.prevent="openShortRest"
          />
        </UTooltip>

        <UTooltip :text="SHEET_LABELS.longRest">
          <UButton
            :icon="REST_ICON.long"
            color="neutral"
            variant="ghost"
            square
            :aria-label="SHEET_LABELS.longRest"
            @click.left.exact.prevent="openLongRest"
          />
        </UTooltip>
      </div>
    </div>

    <SheetSourceWizardModal
      v-model:open="isRacePickerOpen"
      v-model:step="raceStep"
      :title="CATALOG_TREE_TEXT.raceTitle"
      :source="RACE_TREE"
      pane-type="race"
      :hint="CATALOG_TREE_TEXT.raceHint"
      :custom-label="CATALOG_TREE_TEXT.customRace"
      :expand-label="CATALOG_TREE_TEXT.expandRace"
      :is-preparing="isWizardPreparing"
      :review-title="raceDraft?.name"
      children-selectable
      @next="prepareRace"
      @custom="openCustomRace"
      @apply="applyRace"
    >
      <template #review>
        <SheetSourcesReview
          v-if="raceDraft"
          :document="raceDraft.document"
          :source-ids="raceDraft.sourceIds"
          :hint="WIZARD_TEXT.raceReviewHint"
          @change="setRaceDraft"
        />
      </template>
    </SheetSourceWizardModal>

    <SheetCustomEntryModal
      v-model:open="isCustomRaceOpen"
      :title="CATALOG_TREE_TEXT.customRace"
      :hint="CATALOG_TREE_TEXT.customRaceHint"
      @save="pickCustomRace"
    />

    <SheetSourceWizardModal
      v-model:open="isBackgroundPickerOpen"
      v-model:step="backgroundStep"
      :title="WIZARD_TEXT.backgroundTitle"
      :source="BACKGROUND_TREE"
      pane-type="background"
      :hint="WIZARD_TEXT.backgroundHint"
      :custom-label="WIZARD_TEXT.customBackground"
      :expand-label="CATALOG_TREE_TEXT.expandRace"
      :is-preparing="isWizardPreparing"
      :review-title="backgroundDraft?.name"
      @next="prepareBackground"
      @custom="openCustomBackground"
      @apply="applyBackground"
    >
      <template #review>
        <SheetSourcesReview
          v-if="backgroundDraft"
          :document="backgroundDraft.document"
          :source-ids="backgroundDraft.sourceIds"
          :hint="WIZARD_TEXT.backgroundReviewHint"
          @change="setBackgroundDraft"
        />
      </template>
    </SheetSourceWizardModal>

    <SheetCustomEntryModal
      v-model:open="isCustomBackgroundOpen"
      :title="WIZARD_TEXT.customBackground"
      :hint="WIZARD_TEXT.customBackgroundHint"
      @save="pickCustomBackground"
    />

    <SheetClassesModal v-model:open="isClassesOpen" />

    <SheetVisionModal v-model:open="isVisionOpen" />

    <SheetSettingsModal v-model:open="isSettingsOpen" />

    <SheetAbilityScoresModal v-model:open="isAbilityScoresOpen" />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="SHEET_TEXT.removeTitle"
      :description="SHEET_TEXT.removeDescription"
      @confirm="removeSheet"
    />

    <SheetSizeModal v-model:open="isSizeOpen" />

    <SheetExperienceModal
      v-model:open="isExperienceOpen"
      @pick-class="openClasses"
    />

    <SheetShortRestModal v-model:open="isShortRestOpen" />

    <SheetLongRestModal v-model:open="isLongRestOpen" />
  </header>

  <UAlert
    v-if="saveStatus === 'conflict'"
    color="warning"
    variant="subtle"
    :title="SHEET_TEXT.conflict"
    :actions="conflictActions"
  />
</template>
