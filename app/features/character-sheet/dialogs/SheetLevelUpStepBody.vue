<script setup lang="ts">
  import type {
    AbilityKey,
    CatalogOption,
    CatalogRow,
    HitPointsGainMode,
    SheetDocument,
    SheetSpell,
  } from '../model';

  import { useLevelUpWizard } from '../composables';
  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_KEYS,
    ABILITY_LABELS,
    createSpellCatalogPreset,
    FEAT_SEARCH,
    findSource,
    getChoiceAnswers,
    getSourceChoices,
    getSourceLevel,
    HIT_POINTS_GAIN_LABELS,
    HIT_POINTS_GAIN_MODES,
    LEVEL_UP_TEXT,
    loadCatalogSpell,
    SHEET_ICON,
    SPELL_ADD_TEXT,
    SPELL_CATALOG_SOURCE,
    toAbilityKey,
  } from '../model';
  import SheetCatalogAddModal from './SheetCatalogAddModal.vue';
  import SheetCatalogPicker from './SheetCatalogPicker.vue';
  import SheetSourceChoices from './SheetSourceChoices.vue';

  /** Раздел шага: хиты, подкласс, умения, увеличение, заклинания. */
  type StepPart =
    'hitPoints' | 'subclass' | 'features' | 'improvement' | 'spells';

  /**
   * Тело шага мастера уровня: хиты за уровень, подкласс на его уровне,
   * умения уровня карточками с выборами, «Увеличение характеристик»
   * (характеристики или черта) и новые заклинания из справочника. Работает
   * с текущим шагом общего мастера; набор разделов задаёт родитель — окно
   * нового класса раскладывает их по вкладкам.
   */
  const {
    parts = ['hitPoints', 'subclass', 'features', 'improvement', 'spells'],
  } = defineProps<{
    parts?: ReadonlyArray<StepPart>;
  }>();

  const NO_ABILITY = 'none';

  /**
   * Вид кнопки переключателя: выбранная залита.
   * @param isActive - кнопка выбрана
   */
  function getToggleVariant(isActive: boolean): 'solid' | 'outline' {
    return isActive ? 'solid' : 'outline';
  }

  const wizard = useLevelUpWizard();

  const {
    isLoading,
    currentStep,
    draft,
    sheetClass,
    subclassLevel,
    archetypeOptions,
  } = wizard;

  const isFeatPickerOpen = ref(false);
  const isSpellPickerOpen = ref(false);
  /** Свёрнутые карточки умений: по умолчанию карточки с выборами раскрыты. */
  const collapsedIds = ref<ReadonlySet<string>>(new Set());

  /**
   * Раздел показан.
   * @param part - раздел шага
   */
  function hasPart(part: StepPart): boolean {
    return parts.includes(part);
  }

  const isFirstCharacterLevel = computed(
    () => currentStep.value?.before.classes.length === 0,
  );

  const isSubclassStep = computed(
    () =>
      currentStep.value !== null
      && currentStep.value.classLevel === subclassLevel.value
      && !currentStep.value.before.classes.find(
        (candidate) => candidate.id === currentStep.value?.classId,
      )?.archetypeUrl,
  );

  /** Источники умений шага с выборами и пометкой несделанного. */
  const featureCards = computed(() => {
    const step = currentStep.value;

    if (!step) {
      return [];
    }

    return step.sourceIds
      .filter((id) => id !== step.improvementSourceId)
      .flatMap((id) => {
        const source = findSource(draft.value, id);

        if (!source || source.kind === 'class') {
          return [];
        }

        const choices = getSourceChoices(
          source,
          getSourceLevel(draft.value, source),
        );

        const pending = choices.filter(
          (choice) => getChoiceAnswers(source, choice).length < choice.count,
        ).length;

        return [
          {
            id,
            name: source.name,
            hasChoices: choices.length > 0,
            isPending: pending > 0,
            isExpanded: !collapsedIds.value.has(id),
          },
        ];
      });
  });

  const improvementSource = computed(() =>
    currentStep.value?.improvementSourceId
      ? wizard.getDraftSource(currentStep.value.improvementSourceId)
      : undefined,
  );

  const improvementAbilities = computed(
    () => improvementSource.value?.choiceAnswers.asi ?? [],
  );

  const abilityOptions = [
    { label: '—', value: NO_ABILITY },
    ...ABILITY_KEYS.map((key) => ({
      label: ABILITY_LABELS[key].name,
      value: key,
    })),
  ];

  const modeOptions = computed(() =>
    HIT_POINTS_GAIN_MODES.map((mode) => ({
      label: HIT_POINTS_GAIN_LABELS[mode],
      value: mode,
      variant: getToggleVariant(mode === currentStep.value?.hitPointsMode),
    })),
  );

  const improvementVariants = computed(() => ({
    abilities: getToggleVariant(!currentStep.value?.isFeatImprovement),
    feat: getToggleVariant(Boolean(currentStep.value?.isFeatImprovement)),
  }));

  const spellGrowth = computed(() => currentStep.value?.spellGrowth ?? null);

  /** Раздел заклинаний: класс узнаёт новые или у него есть ячейки. */
  const isSpellStep = computed(() => {
    const growth = spellGrowth.value;

    return Boolean(
      growth && (growth.cantrips || growth.spells || growth.maxLevel),
    );
  });

  const spellGrowthLabel = computed(() => {
    const growth = spellGrowth.value;

    if (!growth) {
      return '';
    }

    return [
      growth.cantrips
        ? `${LEVEL_UP_TEXT.newCantrips}: +${growth.cantrips}`
        : '',
      growth.spells ? `${LEVEL_UP_TEXT.newSpells}: +${growth.spells}` : '',
      growth.maxLevel
        ? `${LEVEL_UP_TEXT.maxSpellLevel}: ${growth.maxLevel}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
  });

  /** Заклинания, добавленные этим шагом. */
  const stepSpells = computed(() => {
    const step = currentStep.value;

    if (!step) {
      return [];
    }

    const before = new Set(step.before.spells.map((spell) => spell.id));

    return draft.value.spells.filter((spell) => !before.has(spell.id));
  });

  const spellUrls = computed(() =>
    draft.value.spells.flatMap((spell) => (spell.url ? [spell.url] : [])),
  );

  const spellPreset = computed(() =>
    createSpellCatalogPreset(
      sheetClass.value ? [sheetClass.value.name] : [],
      spellGrowth.value?.maxLevel ?? 0,
    ),
  );

  /**
   * Способ прироста хитов.
   * @param mode - способ
   */
  function setMode(mode: HitPointsGainMode): void {
    wizard.setHitPointsMode(mode);
  }

  /**
   * Подкласс шага.
   * @param url - адрес архетипа
   */
  function setSubclass(url: string): void {
    void wizard.setSubclass(url);
  }

  /**
   * Характеристика одной из двух прибавок «Увеличения характеристик».
   * @param index - номер прибавки
   * @param value - характеристика
   */
  function setImprovementAbility(index: number, value: string): void {
    const next = [...improvementAbilities.value];
    const ability = toAbilityKey(value);

    next[index] = ability ?? '';
    wizard.setImprovementAbilities(next.filter(Boolean));
  }

  /**
   * Значение селекта прибавки.
   * @param index - номер прибавки
   */
  function getImprovementAbility(
    index: number,
  ): AbilityKey | typeof NO_ABILITY {
    return toAbilityKey(improvementAbilities.value[index]) ?? NO_ABILITY;
  }

  /**
   * Черта вместо увеличения характеристик.
   * @param option - выбранная черта
   */
  function pickFeat(option: CatalogOption): void {
    void wizard.setImprovementFeat(option.url);
  }

  /**
   * Черновик после ответа на выбор.
   * @param next - новый черновик
   */
  function setDraft(next: SheetDocument): void {
    wizard.setDraft(next);
  }

  /**
   * Сворачивает или разворачивает карточку умения.
   * @param id - источник умения
   */
  function toggleCard(id: string): void {
    const next = new Set(collapsedIds.value);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    collapsedIds.value = next;
  }

  /**
   * Иконка шеврона карточки.
   * @param isExpanded - карточка развёрнута
   */
  function getChevron(isExpanded: boolean): string {
    return isExpanded ? 'tabler:chevron-down' : 'tabler:chevron-right';
  }

  /**
   * Заклинание справочника для листа.
   * @param row - строка окна добавления
   */
  function loadSpell(row: CatalogRow): Promise<SheetSpell> {
    return loadCatalogSpell({ name: row.name, url: row.url, caption: '' });
  }

  /** Вид дровера описания: у окна заклинаний он один. */
  function getSpellPreviewType(): 'spell' {
    return 'spell';
  }

  /**
   * Добавляет заклинания шага в черновик.
   * @param spells - загруженные заклинания
   */
  function addSpells(spells: Array<SheetSpell>): void {
    setDraft({ ...draft.value, spells: [...draft.value.spells, ...spells] });
  }

  /**
   * Убирает заклинание, добавленное шагом.
   * @param id - заклинание листа
   */
  function removeSpell(id: string): void {
    setDraft({
      ...draft.value,
      spells: draft.value.spells.filter((spell) => spell.id !== id),
    });
  }

  function openFeatPicker(): void {
    isFeatPickerOpen.value = true;
  }

  function openSpellPicker(): void {
    isSpellPickerOpen.value = true;
  }
</script>

<template>
  <div
    v-if="currentStep"
    class="flex flex-col gap-3"
  >
    <section
      v-if="hasPart('hitPoints')"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ LEVEL_UP_TEXT.hitPoints }}: +{{ currentStep.hitPointGain }}
      </h4>

      <p
        v-if="isFirstCharacterLevel"
        class="text-sm text-muted"
      >
        {{ LEVEL_UP_TEXT.hitPointsFirst }}
      </p>

      <div
        v-else
        class="flex flex-wrap items-center gap-2"
      >
        <UFieldGroup>
          <UButton
            v-for="mode in modeOptions"
            :key="mode.value"
            :label="mode.label"
            :variant="mode.variant"
            color="neutral"
            size="sm"
            @click.left.exact.prevent="setMode(mode.value)"
          />
        </UFieldGroup>

        <UButton
          :label="LEVEL_UP_TEXT.rollDie"
          :icon="SHEET_ICON.dice"
          color="neutral"
          variant="subtle"
          size="sm"
          @click.left.exact.prevent="wizard.rollHitDie()"
        />
      </div>
    </section>

    <section
      v-if="hasPart('subclass') && isSubclassStep"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ LEVEL_UP_TEXT.subclass }}
      </h4>

      <USelectMenu
        :model-value="currentStep.subclass?.url"
        :items="archetypeOptions"
        value-key="value"
        :loading="isLoading"
        class="w-full"
        @update:model-value="setSubclass"
      />
    </section>

    <section
      v-if="hasPart('features')"
      class="flex flex-col gap-2"
    >
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ LEVEL_UP_TEXT.features }}
      </h4>

      <p
        v-if="!featureCards.length"
        class="text-sm text-muted"
      >
        {{ LEVEL_UP_TEXT.noFeatures }}
      </p>

      <div
        v-for="card in featureCards"
        :key="card.id"
        class="rounded-lg border border-default"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg p-3 text-left transition-colors hover:bg-elevated/40"
          :class="{ 'cursor-pointer': card.hasChoices }"
          :aria-expanded="card.isExpanded"
          :disabled="!card.hasChoices"
          @click.left.exact.prevent="toggleCard(card.id)"
        >
          <UIcon
            v-if="card.hasChoices"
            :name="getChevron(card.isExpanded)"
            class="size-4 shrink-0 text-muted"
          />

          <span class="min-w-0 grow text-sm font-semibold text-highlighted">
            {{ card.name }}
          </span>

          <UBadge
            v-if="card.isPending"
            :label="LEVEL_UP_TEXT.pendingBadge"
            color="warning"
            variant="subtle"
            size="sm"
          />
        </button>

        <div
          v-if="card.hasChoices && card.isExpanded"
          class="border-t border-default/50 p-3"
        >
          <SheetSourceChoices
            :document="draft"
            :source-id="card.id"
            @change="setDraft"
          />
        </div>
      </div>
    </section>

    <section
      v-if="hasPart('improvement') && currentStep.improvementSourceId"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ LEVEL_UP_TEXT.abilityImprovement }}
      </h4>

      <UFieldGroup>
        <UButton
          :label="ABILITY_IMPROVEMENT_LABELS.abilities"
          :variant="improvementVariants.abilities"
          color="neutral"
          size="sm"
          @click.left.exact.prevent="wizard.resetImprovement()"
        />

        <UButton
          :label="ABILITY_IMPROVEMENT_LABELS.feat"
          :variant="improvementVariants.feat"
          color="neutral"
          size="sm"
          @click.left.exact.prevent="openFeatPicker"
        />
      </UFieldGroup>

      <template v-if="!currentStep.isFeatImprovement">
        <p class="text-xs text-muted">
          {{ ABILITY_IMPROVEMENT_LABELS.points }}
        </p>

        <div class="grid grid-cols-2 gap-2">
          <USelect
            v-for="index in [0, 1]"
            :key="index"
            :model-value="getImprovementAbility(index)"
            :items="abilityOptions"
            class="w-full"
            @update:model-value="setImprovementAbility(index, $event)"
          />
        </div>
      </template>

      <template v-else-if="improvementSource">
        <p class="text-sm font-medium text-highlighted">
          {{ improvementSource.name }}
        </p>

        <SheetSourceChoices
          :document="draft"
          :source-id="improvementSource.id"
          @change="setDraft"
        />
      </template>
    </section>

    <section
      v-if="hasPart('spells') && isSpellStep"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
        {{ LEVEL_UP_TEXT.spells }}
      </h4>

      <p
        v-if="spellGrowthLabel"
        class="text-sm text-toned"
      >
        {{ spellGrowthLabel }}
      </p>

      <div
        v-if="stepSpells.length"
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="spell in stepSpells"
          :key="spell.id"
          :label="spell.name"
          color="primary"
          variant="subtle"
          trailing-icon="tabler:x"
          class="cursor-pointer"
          @click.left.exact.prevent="removeSpell(spell.id)"
        />
      </div>

      <UButton
        :label="LEVEL_UP_TEXT.addSpells"
        :icon="SHEET_ICON.add"
        color="neutral"
        variant="outline"
        size="sm"
        class="self-start"
        @click.left.exact.prevent="openSpellPicker"
      />
    </section>

    <SheetCatalogPicker
      v-model:open="isFeatPickerOpen"
      :title="ABILITY_IMPROVEMENT_LABELS.featPick"
      :source="FEAT_SEARCH"
      @pick="pickFeat"
    />

    <SheetCatalogAddModal
      v-model:open="isSpellPickerOpen"
      :title="SPELL_ADD_TEXT.title"
      :source="SPELL_CATALOG_SOURCE"
      :taken-urls="spellUrls"
      :taken-label="SPELL_ADD_TEXT.added"
      :loader="loadSpell"
      :preview-type="getSpellPreviewType"
      :preset="spellPreset"
      @add="addSpells"
    />
  </div>
</template>
