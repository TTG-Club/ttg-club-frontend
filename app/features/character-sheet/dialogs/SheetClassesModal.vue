<script setup lang="ts">
  import type { SheetClass } from '../model';

  import {
    useCharacterSheet,
    useLevelUpWizard,
    useSheetClassData,
  } from '../composables';
  import {
    addSources,
    CHARACTER_LEVEL,
    getCharacterLevel,
    getMissingClassFeatureSources,
    LEVEL_UP_TEXT,
    removeClass,
    removeClassLevel,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';
  import SheetConfirmModal from './SheetConfirmModal.vue';

  /**
   * Классы персонажа: уровень, подкласс и кость хитов каждого. Повышение
   * уровня и новый класс идут через мастер; понижение уровня и снятие класса
   * забирают ровно выданное ими (умения, владения, ресурсы, хиты). Листам до
   * механики можно подтянуть умения класса из справочника.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { getMechanics, getDetail } = useSheetClassData();
  const wizard = useLevelUpWizard();

  const selectedClassUrl = ref<string>();

  const confirmAction = ref<{
    kind: 'level' | 'class';
    classId: string;
  } | null>(null);

  const totalLevel = computed(() => getCharacterLevel(document.value.classes));

  const canAdd = computed(
    () =>
      !document.value.classes.length || totalLevel.value < CHARACTER_LEVEL.max,
  );

  const classOptions = computed(() =>
    wizard.classList.value.map((link) => ({
      label: link.name.rus,
      value: link.url,
    })),
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
    isOpen.value = false;
    void wizard.startLevelUp(sheetClass.id);
  }

  /** Открывает мастер нового класса. */
  function addClass(): void {
    const url = selectedClassUrl.value;

    if (url) {
      isOpen.value = false;
      selectedClassUrl.value = undefined;
      void wizard.startNewClass(url);
    }
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

    update((current) =>
      action.kind === 'class'
        ? removeClass(current, action.classId)
        : removeClassLevel(current, action.classId),
    );
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
    if (open) {
      void wizard.loadClassList();
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

      <div
        v-if="canAdd"
        class="flex items-end gap-2"
      >
        <UFormField
          :label="LEVEL_UP_TEXT.addClass"
          class="flex-1"
        >
          <USelectMenu
            v-model="selectedClassUrl"
            :items="classOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UButton
          :label="SHEET_LABELS.add"
          :icon="SHEET_ICON.add"
          :disabled="!selectedClassUrl"
          @click.left.exact.prevent="addClass"
        />
      </div>

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
</template>
