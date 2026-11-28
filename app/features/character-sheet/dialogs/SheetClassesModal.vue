<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CatalogOption,
    CustomClassPayload,
    SheetClass,
    WIZARD_STEPS,
  } from '../model';

  import {
    useCharacterSheet,
    useClassLevelActions,
    useLevelUpWizard,
    useSheetClassData,
    useStartingEquipment,
  } from '../composables';
  import {
    addSources,
    applyCustomClass,
    CATALOG_TREE_TEXT,
    CHARACTER_LEVEL,
    CLASS_TREE,
    findSource,
    getCharacterLevel,
    getClassStartingEquipment,
    getMissingClassFeatureSources,
    getMulticlassWarning,
    LEVEL_UP_TEXT,
    SHEET_ICON,
    SHEET_LABELS,
    STARTING_EQUIPMENT_TEXT,
    WIZARD_TEXT,
  } from '../model';
  import SheetConfirmModal from './SheetConfirmModal.vue';
  import SheetCustomClassModal from './SheetCustomClassModal.vue';
  import SheetLevelUpStepBody from './SheetLevelUpStepBody.vue';
  import SheetSourcesReview from './SheetSourcesReview.vue';
  import SheetSourceWizardModal from './SheetSourceWizardModal.vue';
  import SheetStartingEquipment from './SheetStartingEquipment.vue';

  /**
   * Классы персонажа: уровень, подкласс и кость хитов каждого. Повышение
   * уровня и новый класс идут через мастер; понижение уровня и снятие класса
   * забирают ровно выданное ими (умения, владения, ресурсы, хиты). Листам до
   * механики можно подтянуть умения класса из справочника. Класс выбирают
   * мастером «Добавление класса» (у листа без классов он открывается сразу):
   * класс или подкласс с описанием, затем итог по вкладкам — хиты, владения
   * и выборы класса, умения уровня. Свой класс добавляется без мастера и
   * повышается по среднему кости.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { getMechanics, getDetail } = useSheetClassData();
  const wizard = useLevelUpWizard();
  const { levelUp: raiseLevel, levelDown, dropClass } = useClassLevelActions();

  const isPickerOpen = ref(false);
  const isCustomOpen = ref(false);
  const wizardStep = ref<(typeof WIZARD_STEPS)[number]>('pick');
  const reviewTab = ref<'overview' | 'features' | 'equipment'>('overview');

  // Стартовое снаряжение дают только первому классу персонажа
  const equipment = useStartingEquipment();
  const isPreparing = ref(false);
  /** Подкласс выбран в списке, но класс выбирает его позже первого уровня. */
  const isSubclassDeferred = ref(false);

  const reviewTabs = computed<Array<TabsItem>>(() => [
    { value: 'overview', label: WIZARD_TEXT.classTabs.overview },
    { value: 'features', label: WIZARD_TEXT.classTabs.features },
    ...(equipment.hasEquipment.value
      ? [{ value: 'equipment', label: STARTING_EQUIPMENT_TEXT.tab }]
      : []),
  ]);

  const newStep = computed(() =>
    wizardStep.value === 'review' ? wizard.currentStep.value : null,
  );

  const reviewTitle = computed(() => {
    const step = newStep.value;

    if (!step) {
      return '';
    }

    return step.subclass
      ? `${step.className} (${step.subclass.name})`
      : step.className;
  });

  /** Источник самого класса: его владения и выборы — во вкладке «Основное». */
  const classSourceIds = computed(() => {
    const step = newStep.value;

    if (!step) {
      return [];
    }

    return step.sourceIds.filter(
      (id) => findSource(step.after, id)?.kind === 'class',
    );
  });

  const subclassDeferredText = computed(() =>
    WIZARD_TEXT.subclassLater.replace(
      '{level}',
      String(wizard.subclassLevel.value ?? ''),
    ),
  );

  const confirmAction = ref<{
    kind: 'level' | 'class';
    classId: string;
  } | null>(null);

  const totalLevel = computed(() => getCharacterLevel(document.value.classes));

  const canAdd = computed(
    () =>
      !document.value.classes.length || totalLevel.value < CHARACTER_LEVEL.max,
  );

  const takenClassUrls = computed(() =>
    document.value.classes.flatMap((sheetClass) =>
      sheetClass.url ? [sheetClass.url] : [],
    ),
  );

  const rows = computed(() =>
    document.value.classes.map((sheetClass) => {
      const detail =
        getMechanics(sheetClass.archetypeUrl) ?? getMechanics(sheetClass.url);

      return {
        sheetClass,
        title: sheetClass.archetypeName
          ? `${sheetClass.name} (${sheetClass.archetypeName})`
          : sheetClass.name,
        canLevelUp: totalLevel.value < CHARACTER_LEVEL.max,
        missing: getMissingClassFeatureSources(
          document.value,
          sheetClass,
          detail,
        ),
        syncActions: [
          {
            label: LEVEL_UP_TEXT.syncFeatures,
            onClick: () => syncFeatures(sheetClass),
          },
        ],
        levelLabel: `${sheetClass.level} ${SHEET_LABELS.level.toLowerCase()}`,
        needsSync:
          Boolean(detail)
          && !document.value.sources.some(
            (source) => source.classId === sheetClass.id,
          ),
      };
    }),
  );

  const isConfirmOpen = computed({
    get: () => confirmAction.value !== null,
    set: (open: boolean) => {
      if (!open) {
        confirmAction.value = null;
      }
    },
  });

  const confirmTitle = computed(() =>
    confirmAction.value?.kind === 'class'
      ? LEVEL_UP_TEXT.removeClassTitle
      : LEVEL_UP_TEXT.removeLevelTitle,
  );

  const confirmDescription = computed(() =>
    confirmAction.value?.kind === 'class'
      ? LEVEL_UP_TEXT.removeClassDescription
      : LEVEL_UP_TEXT.removeLevelDescription,
  );

  /**
   * Открывает мастер повышения уровня класса.
   * @param sheetClass - класс листа
   */
  function levelUp(sheetClass: SheetClass): void {
    if (raiseLevel(sheetClass)) {
      isOpen.value = false;
    }
  }

  function openPicker(): void {
    isPickerOpen.value = true;
  }

  function openCustom(): void {
    isCustomOpen.value = true;
  }

  /**
   * Адрес класса выбранной записи: у подкласса — его класс.
   * @param option - класс или подкласс из списка
   */
  function getClassUrl(option: CatalogOption): string {
    return option.parentUrl ?? option.url;
  }

  /**
   * Предупреждение о мультиклассировании для выбранной записи.
   * @param option - класс или подкласс из списка
   */
  function getWarning(option: CatalogOption | null): string | null {
    return option
      ? getMulticlassWarning(document.value, getClassUrl(option))
      : null;
  }

  /**
   * Готовит итог мастера: первый уровень класса в черновике.
   * @param option - класс или подкласс из списка
   */
  async function prepareClass(option: CatalogOption): Promise<void> {
    isPreparing.value = true;

    try {
      const subclassUrl = option.parentUrl ? option.url : null;
      const isFirstClass = !document.value.classes.length;

      if (await wizard.prepareNewClass(getClassUrl(option), subclassUrl)) {
        const traits = wizard.getDetails(getClassUrl(option))?.detail.traits;

        equipment.reset(
          isFirstClass
            ? getClassStartingEquipment(
                traits?.startingEquipment,
                traits?.equipment,
              )
            : [],
        );

        isSubclassDeferred.value =
          Boolean(subclassUrl) && !wizard.currentStep.value?.subclass;

        reviewTab.value = 'overview';
        wizardStep.value = 'review';
      }
    } finally {
      isPreparing.value = false;
    }
  }

  /**
   * Переключает вкладку итога.
   * @param value - вкладка
   */
  function changeReviewTab(value: string | number): void {
    reviewTab.value =
      value === 'features' || value === 'equipment' ? value : 'overview';
  }

  /** Переносит новый класс в лист, затем стартовое снаряжение. */
  function applyClass(): void {
    wizard.apply();
    void equipment.apply();
    isPickerOpen.value = false;
    isOpen.value = false;
  }

  /**
   * Добавляет свой класс первым уровнем.
   * @param payload - класс: название, кость хитов и владения
   */
  function addCustomClass(payload: CustomClassPayload): void {
    update((current) => applyCustomClass(current, payload));
  }

  /**
   * Просит подтвердить понижение уровня или снятие класса.
   * @param kind - что снимается
   * @param classId - класс листа
   */
  function askRemove(kind: 'level' | 'class', classId: string): void {
    confirmAction.value = { kind, classId };
  }

  function confirmRemove(): void {
    const action = confirmAction.value;

    if (!action) {
      return;
    }

    if (action.kind === 'class') {
      dropClass(action.classId);
    } else {
      levelDown(action.classId);
    }
  }

  /**
   * Подтягивает умения класса из справочника листу до механики.
   * @param sheetClass - класс листа
   */
  function syncFeatures(sheetClass: SheetClass): void {
    const detail =
      getMechanics(sheetClass.archetypeUrl) ?? getMechanics(sheetClass.url);

    update((current) =>
      addSources(
        current,
        getMissingClassFeatureSources(current, sheetClass, detail),
      ),
    );
  }

  /**
   * Кость хитов класса подписью.
   * @param sheetClass - класс листа
   */
  function getHitDieLabel(sheetClass: SheetClass): string {
    return `${SHEET_LABELS.hitDie}: к${getDetail(sheetClass.url)?.traits?.diceHp ?? sheetClass.hitDie}`;
  }

  watch(isOpen, (open) => {
    if (open && !document.value.classes.length) {
      openPicker();
    }
  });

  // Закрытый без «Применить» мастер не оставляет черновика
  watch(isPickerOpen, (open) => {
    if (!open && !wizard.isOpen.value) {
      wizard.close();
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_LABELS.classes"
    :ui="{ content: 'max-w-xl', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <ul
        v-if="rows.length"
        class="flex flex-col gap-3"
      >
        <li
          v-for="row in rows"
          :key="row.sheetClass.id"
          class="flex flex-col gap-2 rounded-lg border border-default p-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold text-highlighted">{{ row.title }}</span>

            <UBadge
              :label="row.levelLabel"
              color="neutral"
              variant="subtle"
            />

            <span class="text-xs text-muted">{{
              getHitDieLabel(row.sheetClass)
            }}</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              :label="LEVEL_UP_TEXT.levelUp"
              icon="tabler:arrow-big-up-lines"
              size="sm"
              :disabled="!row.canLevelUp"
              @click.left.exact.prevent="levelUp(row.sheetClass)"
            />

            <UButton
              :label="LEVEL_UP_TEXT.levelDown"
              icon="tabler:arrow-big-down-lines"
              color="neutral"
              variant="subtle"
              size="sm"
              @click.left.exact.prevent="askRemove('level', row.sheetClass.id)"
            />

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="SHEET_LABELS.remove"
              color="error"
              variant="ghost"
              size="sm"
              @click.left.exact.prevent="askRemove('class', row.sheetClass.id)"
            />
          </div>

          <UAlert
            v-if="row.needsSync && row.missing.length"
            color="warning"
            variant="subtle"
            :description="LEVEL_UP_TEXT.syncHint"
            :actions="row.syncActions"
          />
        </li>
      </ul>

      <UButton
        v-if="canAdd"
        :label="LEVEL_UP_TEXT.addClass"
        :icon="SHEET_ICON.add"
        color="neutral"
        variant="outline"
        class="self-start"
        @click.left.exact.prevent="openPicker"
      />

      <p
        v-if="document.classes.length"
        class="text-xs text-dimmed"
      >
        {{ LEVEL_UP_TEXT.multiclassNote }}
      </p>

      <SheetConfirmModal
        v-model:open="isConfirmOpen"
        :title="confirmTitle"
        :description="confirmDescription"
        @confirm="confirmRemove"
      />
    </template>
  </UModal>

  <SheetSourceWizardModal
    v-model:open="isPickerOpen"
    v-model:step="wizardStep"
    :title="CATALOG_TREE_TEXT.classTitle"
    :source="CLASS_TREE"
    pane-type="class"
    :hint="CATALOG_TREE_TEXT.classHint"
    :custom-label="CATALOG_TREE_TEXT.customClass"
    :expand-label="CATALOG_TREE_TEXT.expandClass"
    :excluded-urls="takenClassUrls"
    :is-preparing="isPreparing"
    :review-title="reviewTitle"
    children-selectable
    @next="prepareClass"
    @custom="openCustom"
    @apply="applyClass"
  >
    <template #note="{ selected }">
      <UAlert
        v-if="getWarning(selected)"
        color="warning"
        variant="subtle"
        icon="tabler:alert-triangle"
        :description="getWarning(selected) ?? ''"
      />
    </template>

    <template #review>
      <template v-if="newStep">
        <UAlert
          v-if="isSubclassDeferred"
          color="neutral"
          variant="subtle"
          icon="tabler:info-circle"
          :description="subclassDeferredText"
        />

        <UTabs
          :items="reviewTabs"
          :model-value="reviewTab"
          :content="false"
          variant="pill"
          :ui="{ list: 'w-full' }"
          @update:model-value="changeReviewTab"
        />

        <div
          v-if="reviewTab === 'overview'"
          class="flex flex-col gap-3"
        >
          <SheetLevelUpStepBody :parts="['hitPoints', 'subclass']" />

          <SheetSourcesReview
            :document="newStep.after"
            :source-ids="classSourceIds"
            @change="wizard.setDraft"
          />
        </div>

        <SheetStartingEquipment
          v-else-if="reviewTab === 'equipment'"
          v-model:choices="equipment.choices.value"
          v-model:picks="equipment.picks.value"
          v-model:enabled="equipment.isEnabled.value"
          :lines="equipment.lines.value"
        />

        <SheetLevelUpStepBody
          v-else
          :parts="['features', 'improvement', 'spells']"
        />
      </template>
    </template>
  </SheetSourceWizardModal>

  <SheetCustomClassModal
    v-model:open="isCustomOpen"
    @save="addCustomClass"
  />
</template>
