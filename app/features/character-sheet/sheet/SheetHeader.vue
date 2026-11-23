<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { CatalogOption, SheetDocument, SourceKind } from '../model';

  import { uniq } from 'es-toolkit';

  import { getApiErrorMessage } from '~user/model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    SheetCatalogPicker,
    SheetClassesModal,
    SheetRestModal,
    SheetSourceChoicesModal,
  } from '../dialogs';
  import {
    addSources,
    BACKGROUND_SEARCH,
    CHARACTER_SHEET_ROUTE,
    EXPERIENCE_BY_LEVEL,
    getClassesLabel,
    getNextLevelExperience,
    getPendingChoices,
    loadBackgroundSources,
    loadRaceSources,
    RACE_SEARCH,
    removeSources,
    replaceRaceBonuses,
    SHEET_BODY_LABELS,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_MENU_LABELS,
    SHEET_SAVE_STATUS_ICON,
    SHEET_SAVE_STATUS_TEXT,
    SHEET_TEXT,
  } from '../model';

  /**
   * Шапка листа, как на new.ttg.club: портрет, имя, подпись «Раса — Класс N
   * — Предыстория» (каждая часть открывает свой выбор), полоса опыта до
   * следующего уровня, справа — состояние сохранения, замок, меню и
   * закрытие, вдохновение и отдых. Раса и предыстория применяются через
   * механику справочника; их выборы открываются сразу.
   */
  const LANGUAGES_SEPARATOR = ', ';

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
  } = useCharacterSheet();

  const { stats } = useSheetStats();

  const isRacePickerOpen = ref(false);
  const isBackgroundPickerOpen = ref(false);
  const isClassesOpen = ref(false);
  const restMode = ref<'short' | 'long' | null>(null);
  const choiceSourceIds = ref<Array<string>>([]);

  const isRestOpen = computed({
    get: () => restMode.value !== null,
    set: (open: boolean) => {
      if (!open) {
        restMode.value = null;
      }
    },
  });

  const isChoicesOpen = computed({
    get: () => choiceSourceIds.value.length > 0,
    set: (open: boolean) => {
      if (!open) {
        choiceSourceIds.value = [];
      }
    },
  });

  const level = computed(() => stats.value.level);
  const classLabel = computed(() => getClassesLabel(document.value.classes));

  const raceLabel = computed(
    () => document.value.race?.name ?? SHEET_BODY_LABELS.noRace,
  );

  const backgroundLabel = computed(
    () => document.value.background?.name ?? SHEET_BODY_LABELS.noBackground,
  );

  const nextExperience = computed(() => getNextLevelExperience(level.value));

  /** Доля пути к следующему уровню, %: полоса делится подписью пополам. */
  const progress = computed(() => {
    const from = EXPERIENCE_BY_LEVEL[level.value - 1] ?? 0;
    const to = nextExperience.value;

    if (to === null || to <= from) {
      return 100;
    }

    return Math.min(
      100,
      Math.max(0, ((document.value.experience - from) / (to - from)) * 100),
    );
  });

  const leftWidth = computed(() => `${Math.min(100, progress.value * 2)}%`);

  const rightWidth = computed(
    () => `${Math.max(0, progress.value * 2 - 100)}%`,
  );

  const experienceLabel = computed(
    () => `${document.value.experience} / ${nextExperience.value ?? '—'} XP`,
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

  const menuItems: Array<DropdownMenuItem> = [
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
  ];

  /**
   * Имя персонажа.
   * @param value - новое имя
   */
  function setName(value: string | number): void {
    rename(String(value));
  }

  /**
   * Опыт персонажа.
   * @param value - очки опыта
   */
  function setExperience(value: number | null): void {
    update((current) => ({ ...current, experience: Math.max(0, value ?? 0) }));
  }

  /**
   * Мировоззрение.
   * @param value - новое значение
   */
  function setAlignment(value: string | number): void {
    update((current) => ({ ...current, alignment: String(value) }));
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
   * Открывает выборы новых источников, если среди них есть несделанные.
   * @param next - лист после применения
   * @param ids - новые источники
   */
  function openPendingChoices(
    next: SheetDocument,
    ids: ReadonlyArray<string>,
  ): void {
    const pending = getPendingChoices(next).filter((entry) =>
      ids.includes(entry.source.id),
    );

    if (pending.length) {
      choiceSourceIds.value = uniq(pending.map((entry) => entry.source.id));
    }
  }

  /**
   * Ставит расу: прежняя снимается со всеми выдачами, новая применяется
   * через механику (повышения, чувства, скорости, владения, выборы).
   * @param option - выбранная раса
   */
  async function pickRace(option: CatalogOption): Promise<void> {
    try {
      const result = await loadRaceSources(option, level.value);

      let next: SheetDocument = document.value;

      update((current) => {
        next = addSources(
          {
            ...stripRace(current),
            race: result.race,
            speed: result.speed ?? current.speed,
          },
          result.sources,
        );

        return next;
      });

      openPendingChoices(
        next,
        result.sources.map((source) => source.id),
      );
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  function clearRace(): void {
    update(stripRace);
  }

  /**
   * Ставит предысторию: прежняя снимается, новая выдаёт навыки (из механики
   * или по названиям), владения и выборы; языки без механики дописываются
   * текстом, как раньше.
   * @param option - выбранная предыстория
   */
  async function pickBackground(option: CatalogOption): Promise<void> {
    try {
      const result = await loadBackgroundSources(option, level.value);

      let next: SheetDocument = document.value;

      update((current) => {
        const stripped = stripBackground(current);

        const languages = uniq([
          ...stripped.proficiencies.languages
            .split(LANGUAGES_SEPARATOR)
            .map((language) => language.trim())
            .filter(Boolean),
          ...result.languages,
        ]).join(LANGUAGES_SEPARATOR);

        next = addSources(
          {
            ...stripped,
            background: result.background,
            proficiencies: { ...stripped.proficiencies, languages },
          },
          [result.source],
        );

        return next;
      });

      openPendingChoices(next, [result.source.id]);
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  function clearBackground(): void {
    update(stripBackground);
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

  function openShortRest(): void {
    restMode.value = 'short';
  }

  function openLongRest(): void {
    restMode.value = 'long';
  }
</script>

<template>
  <header
    class="@container flex flex-col items-center gap-4 @2xl:flex-row @2xl:items-start @2xl:gap-6"
  >
    <div class="relative mb-2 shrink-0 @2xl:mb-0">
      <div
        class="grid size-24 place-items-center overflow-hidden rounded-full border-2 border-primary/60 bg-elevated"
        :aria-label="SHEET_BODY_LABELS.avatar"
      >
        <UIcon
          name="tabler:user"
          class="size-10 text-muted"
        />
      </div>
    </div>

    <div class="flex w-full min-w-0 grow flex-col gap-1 @2xl:w-auto">
      <UPopover>
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

            <UFormField :label="SHEET_LABELS.alignment">
              <UInput
                :model-value="document.alignment"
                class="w-full"
                @update:model-value="setAlignment"
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

      <UPopover>
        <button
          type="button"
          class="mt-2 flex w-full cursor-pointer items-center gap-3 rounded p-1 text-xs text-toned transition-colors hover:bg-elevated/40 @5xl:max-w-lg"
          :aria-label="SHEET_BODY_LABELS.experience"
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

        <template #content>
          <div class="w-64 p-3">
            <UFormField :label="SHEET_LABELS.experience">
              <UInputNumber
                :model-value="document.experience"
                :min="0"
                class="w-full"
                @update:model-value="setExperience"
              />
            </UFormField>
          </div>
        </template>
      </UPopover>
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
            icon="tabler:campfire"
            color="neutral"
            variant="ghost"
            square
            :aria-label="SHEET_LABELS.shortRest"
            @click.left.exact.prevent="openShortRest"
          />
        </UTooltip>

        <UTooltip :text="SHEET_LABELS.longRest">
          <UButton
            icon="tabler:moon"
            color="neutral"
            variant="ghost"
            square
            :aria-label="SHEET_LABELS.longRest"
            @click.left.exact.prevent="openLongRest"
          />
        </UTooltip>
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

    <SheetRestModal
      v-if="restMode"
      v-model:open="isRestOpen"
      :mode="restMode"
    />

    <SheetSourceChoicesModal
      v-model:open="isChoicesOpen"
      :source-ids="choiceSourceIds"
    />
  </header>

  <UAlert
    v-if="saveStatus === 'conflict'"
    color="warning"
    variant="subtle"
    :title="SHEET_TEXT.conflict"
    :actions="conflictActions"
  />
</template>
