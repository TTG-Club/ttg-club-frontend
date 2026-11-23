<script setup lang="ts">
  import type {
    AbilityKey,
    CatalogOption,
    HitPointsGainMode,
    SheetDocument,
  } from '../model';

  import { range } from 'es-toolkit';

  import { useLevelUpWizard } from '../composables';
  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_KEYS,
    ABILITY_LABELS,
    FEAT_SEARCH,
    HIT_POINTS_GAIN_LABELS,
    HIT_POINTS_GAIN_MODES,
    LEVEL_UP_RAIL_CLASSES,
    LEVEL_UP_TEXT,
    SHEET_ICON,
    toAbilityKey,
  } from '../model';
  import SheetCatalogPicker from './SheetCatalogPicker.vue';
  import SheetSourceChoices from './SheetSourceChoices.vue';

  /**
   * Мастер повышения уровня и нового класса: рельса уровней, на шаге —
   * хиты за уровень, подкласс на его уровне, умения уровня с выборами и
   * «Увеличение характеристик» (характеристики или черта). Изменения копятся
   * в черновике и переносятся в лист кнопкой «Применить».
   */
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
    isOpen,
    isLoading,
    currentStep,
    draft,
    sheetClass,
    subclassLevel,
    archetypeOptions,
    targetLevel,
    maxTargetLevel,
    isLastStep,
    steps,
  } = wizard;

  const isFeatPickerOpen = ref(false);

  const title = computed(() =>
    sheetClass.value
      ? `${LEVEL_UP_TEXT.title}: ${sheetClass.value.name}`
      : LEVEL_UP_TEXT.title,
  );

  const firstLevel = computed(() => steps.value[0]?.classLevel ?? 1);

  const rail = computed(() =>
    range(
      firstLevel.value,
      Math.max(targetLevel.value, firstLevel.value) + 1,
    ).map((level) => {
      const current = currentStep.value?.classLevel ?? 0;

      let state: keyof typeof LEVEL_UP_RAIL_CLASSES = 'upcoming';

      if (level < current) {
        state = 'done';
      } else if (level === current) {
        state = 'current';
      }

      return { level, railClass: LEVEL_UP_RAIL_CLASSES[state] };
    }),
  );

  const isFirstCharacterLevel = computed(
    () => currentStep.value?.before.classes.length === 0,
  );

  const isSubclassStep = computed(
    () =>
      currentStep.value !== null
      && currentStep.value.classLevel === subclassLevel.value
      && !currentStep.value.before.classes.find(
        (candidate) => candidate.id === sheetClass.value?.id,
      )?.archetypeUrl,
  );

  const choiceSourceIds = computed(() =>
    (currentStep.value?.sourceIds ?? []).filter(
      (id) => id !== currentStep.value?.improvementSourceId,
    ),
  );

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

  const featureNames = computed(() =>
    (currentStep.value?.features ?? [])
      .map((feature) => feature.name)
      .join(', '),
  );

  /**
   * Способ прироста хитов.
   * @param mode - способ
   */
  function setMode(mode: HitPointsGainMode): void {
    wizard.setHitPointsMode(mode);
  }

  /**
   * Целевой уровень класса.
   * @param value - уровень
   */
  function setTarget(value: number | null): void {
    targetLevel.value = Math.min(
      Math.max(value ?? firstLevel.value, firstLevel.value),
      maxTargetLevel.value,
    );
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

  function openFeatPicker(): void {
    isFeatPickerOpen.value = true;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :dismissible="false"
    :ui="{ content: 'max-w-3xl', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <div
        v-if="isLoading && !currentStep"
        class="flex items-center gap-2 text-sm text-muted"
      >
        <UIcon
          :name="SHEET_ICON.loading"
          class="size-4 animate-spin"
        />

        {{ LEVEL_UP_TEXT.loading }}
      </div>

      <template v-else-if="currentStep">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField :label="LEVEL_UP_TEXT.targetLevel">
            <UInputNumber
              :model-value="targetLevel"
              :min="firstLevel"
              :max="maxTargetLevel"
              class="w-28"
              @update:model-value="setTarget"
            />
          </UFormField>

          <div class="flex flex-wrap gap-1">
            <span
              v-for="item in rail"
              :key="item.level"
              class="grid size-7 place-items-center rounded-md border text-xs font-bold"
              :class="item.railClass"
            >
              {{ item.level }}
            </span>
          </div>
        </div>

        <section
          class="flex flex-col gap-2 rounded-lg border border-default p-3"
        >
          <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
            {{ LEVEL_UP_TEXT.step }} {{ currentStep.classLevel }} ·
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
          v-if="isSubclassStep"
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
          class="flex flex-col gap-2 rounded-lg border border-default p-3"
        >
          <h4 class="text-[11px] font-bold tracking-wider text-muted uppercase">
            {{ LEVEL_UP_TEXT.features }}
          </h4>

          <p class="text-sm text-toned">
            {{ featureNames || LEVEL_UP_TEXT.noFeatures }}
          </p>

          <SheetSourceChoices
            v-for="id in choiceSourceIds"
            :key="id"
            :document="draft"
            :source-id="id"
            @change="setDraft"
          />
        </section>

        <section
          v-if="currentStep.improvementSourceId"
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

        <p class="text-xs text-dimmed">
          {{ LEVEL_UP_TEXT.pendingChoices }}
        </p>
      </template>

      <SheetCatalogPicker
        v-model:open="isFeatPickerOpen"
        :title="ABILITY_IMPROVEMENT_LABELS.featPick"
        :source="FEAT_SEARCH"
        @pick="pickFeat"
      />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          :label="LEVEL_UP_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="wizard.close()"
        />

        <div class="flex gap-2">
          <UButton
            v-if="steps.length > 1"
            :label="LEVEL_UP_TEXT.back"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="wizard.back()"
          />

          <UButton
            v-if="!isLastStep"
            :label="LEVEL_UP_TEXT.next"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="wizard.next()"
          />

          <UButton
            :label="LEVEL_UP_TEXT.apply"
            :disabled="!currentStep"
            @click.left.exact.prevent="wizard.apply()"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
