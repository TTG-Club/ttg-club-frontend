<script setup lang="ts">
  import type { CatalogOption, SheetClass } from '../model';

  import {
    useCharacterSheet,
    useClassLevelActions,
    useLevelUpWizard,
    useSheetClassData,
  } from '../composables';
  import {
    addSources,
    applyLevelUpStep,
    CATALOG_TREE_ICON,
    CATALOG_TREE_TEXT,
    CHARACTER_LEVEL,
    CLASS_TREE,
    createCustomClassStep,
    getCharacterLevel,
    getMissingClassFeatureSources,
    LEVEL_UP_TEXT,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';
  import SheetCatalogTreeModal from './SheetCatalogTreeModal.vue';
  import SheetConfirmModal from './SheetConfirmModal.vue';
  import SheetCustomEntryModal from './SheetCustomEntryModal.vue';

  /**
   * Классы персонажа: уровень, подкласс и кость хитов каждого. Повышение
   * уровня и новый класс идут через мастер; понижение уровня и снятие класса
   * забирают ровно выданное ими (умения, владения, ресурсы, хиты). Листам до
   * механики можно подтянуть умения класса из справочника. Класс выбирают в
   * окне «Добавление класса» (у листа без классов оно открывается сразу);
   * свой класс добавляется без мастера и повышается по среднему кости.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { getMechanics, getDetail } = useSheetClassData();
  const wizard = useLevelUpWizard();
  const { levelUp: raiseLevel, levelDown, dropClass } = useClassLevelActions();

  const isPickerOpen = ref(false);
  const isCustomOpen = ref(false);

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
   * Открывает мастер нового класса для выбранного в окне «Добавление класса».
   * @param option - выбранный класс
   */
  function addClass(option: CatalogOption): void {
    isOpen.value = false;
    void wizard.startNewClass(option.url);
  }

  /**
   * Добавляет свой класс первым уровнем.
   * @param name - название класса
   * @param hitDie - кость хитов
   */
  function addCustomClass(name: string, hitDie: number): void {
    update((current) =>
      applyLevelUpStep(current, createCustomClassStep(current, name, hitDie)),
    );
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

  <SheetCatalogTreeModal
    v-model:open="isPickerOpen"
    :title="CATALOG_TREE_TEXT.classTitle"
    :source="CLASS_TREE"
    :hint="CATALOG_TREE_TEXT.classHint"
    :confirm-label="CATALOG_TREE_TEXT.next"
    :confirm-icon="CATALOG_TREE_ICON.next"
    :custom-label="CATALOG_TREE_TEXT.customClass"
    :expand-label="CATALOG_TREE_TEXT.expandClass"
    :excluded-urls="takenClassUrls"
    @pick="addClass"
    @custom="openCustom"
  />

  <SheetCustomEntryModal
    v-model:open="isCustomOpen"
    :title="CATALOG_TREE_TEXT.customClass"
    :hint="CATALOG_TREE_TEXT.customClassHint"
    with-hit-die
    @save="addCustomClass"
  />
</template>
