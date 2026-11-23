<script setup lang="ts">
  import type { ClassLink } from '~character/model';

  import type { SheetClass } from '../model';

  import { z } from 'zod';

  import { CLASSES_SECTION, classLinkSchema } from '~character/model';
  import { buildListRequest, SECTION_PAGE_SIZE_ALL } from '~section/model';
  import { getApiErrorMessage } from '~user/model';

  import { useCharacterSheet, useSheetClassData } from '../composables';
  import {
    ABILITY_LABELS,
    CHARACTER_LEVEL,
    getCharacterLevel,
    getSuggestedMaxHitPoints,
    loadClassSelection,
    SHEET_ICON,
    SHEET_LABELS,
    SKILL_INFO,
    SKILL_KEYS,
  } from '../model';

  /**
   * Классы персонажа: уровни, подклассы, мультикласс. Первый класс задаёт
   * спасброски и заклинательную характеристику, если они ещё не выбраны.
   */
  const NO_ARCHETYPE = '';

  const isOpen = defineModel<boolean>('open', { default: false });

  const api = useApi();
  const toast = useToast();
  const { document, update } = useCharacterSheet();
  const { getDetail } = useSheetClassData();

  const classList = shallowRef<Array<ClassLink>>([]);
  const isListLoading = ref(false);
  const isAdding = ref(false);
  const selectedClassUrl = ref<string>();

  const totalLevel = computed(() => getCharacterLevel(document.value.classes));

  const canAdd = computed(
    () =>
      document.value.classes.length === 0
      || totalLevel.value < CHARACTER_LEVEL.max,
  );

  const classOptions = computed(() =>
    classList.value.map((classLink) => ({
      label: classLink.name.rus,
      value: classLink.url,
    })),
  );

  /** Подсказка о навыках и спасбросках первого класса из справочника. */
  const firstClassHint = computed(() => {
    const first = document.value.classes[0];
    const traits = first ? getDetail(first.url)?.traits : undefined;

    if (!first || !traits) {
      return null;
    }

    const skills = (traits.availableSkills ?? []).join(', ');

    return {
      savingThrows: traits.savingThrows ?? '',
      skills: skills
        ? `${SHEET_LABELS.skillsHint}: ${traits.skillAvailableCount} из ${skills}`
        : '',
    };
  });

  /**
   * Подклассы класса из списка для выбора.
   * @param sheetClass - класс персонажа
   */
  function getArchetypeOptions(sheetClass: SheetClass) {
    const classLink = classList.value.find(
      (candidate) => candidate.url === sheetClass.url,
    );

    return [
      { label: SHEET_LABELS.noArchetype, value: NO_ARCHETYPE },
      ...(classLink?.archetypes ?? []).map((archetype) => ({
        label: archetype.name.rus,
        value: archetype.url,
      })),
    ];
  }

  /**
   * Наибольший уровень класса, при котором общий уровень не выше 20.
   * @param sheetClass - класс персонажа
   */
  function getMaxLevel(sheetClass: SheetClass): number {
    return CHARACTER_LEVEL.max - totalLevel.value + sheetClass.level;
  }

  /**
   * Меняет класс персонажа.
   * @param id - идентификатор класса в листе
   * @param patch - изменённые поля
   */
  function patchClass(id: string, patch: Partial<SheetClass>): void {
    update((current) => ({
      ...current,
      classes: current.classes.map((sheetClass) =>
        sheetClass.id === id ? { ...sheetClass, ...patch } : sheetClass,
      ),
    }));
  }

  /**
   * Меняет уровень класса в пределах общего 20-го.
   * @param sheetClass - класс персонажа
   * @param level - новый уровень
   */
  function setLevel(sheetClass: SheetClass, level: number | null): void {
    if (level === null) {
      return;
    }

    patchClass(sheetClass.id, {
      level: Math.min(
        Math.max(level, CHARACTER_LEVEL.min),
        getMaxLevel(sheetClass),
      ),
    });
  }

  /**
   * Выбирает подкласс.
   * @param sheetClass - класс персонажа
   * @param url - адрес подкласса; пустой — без подкласса
   */
  function setArchetype(sheetClass: SheetClass, url: string): void {
    const option = getArchetypeOptions(sheetClass).find(
      (candidate) => candidate.value === url,
    );

    patchClass(sheetClass.id, {
      archetypeUrl: url || null,
      archetypeName: url && option ? option.label : null,
    });
  }

  /**
   * Убирает класс.
   * @param id - идентификатор класса в листе
   */
  function removeClass(id: string): void {
    update((current) => ({
      ...current,
      classes: current.classes.filter((sheetClass) => sheetClass.id !== id),
    }));
  }

  /** Добавляет выбранный класс первым уровнем. */
  async function addClass(): Promise<void> {
    const url = selectedClassUrl.value;

    if (!url) {
      return;
    }

    isAdding.value = true;

    try {
      const selection = await loadClassSelection(url, CHARACTER_LEVEL.min);

      update((current) => {
        const isFirst = current.classes.length === 0;

        const next = {
          ...current,
          classes: [...current.classes, selection.sheetClass],
          savingThrows: isFirst ? selection.savingThrows : current.savingThrows,
          spellcastingAbility:
            current.spellcastingAbility ?? selection.spellAbility,
        };

        return current.health.max
          ? next
          : {
              ...next,
              health: {
                ...next.health,
                max: getSuggestedMaxHitPoints(next),
                current: getSuggestedMaxHitPoints(next),
              },
            };
      });

      selectedClassUrl.value = undefined;
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_LABELS.addClass),
        color: 'error',
      });
    } finally {
      isAdding.value = false;
    }
  }

  /** Загружает список классов один раз, когда окно открывают. */
  async function loadClassList(): Promise<void> {
    if (classList.value.length || isListLoading.value) {
      return;
    }

    isListLoading.value = true;

    try {
      classList.value = z.array(classLinkSchema).parse(
        await api(CLASSES_SECTION.listUrl, {
          method: 'POST',
          body: buildListRequest({ page: 0, size: SECTION_PAGE_SIZE_ALL }),
        }),
      );
    } catch {
      classList.value = [];
    } finally {
      isListLoading.value = false;
    }
  }

  watch(isOpen, (open) => {
    if (open) {
      loadClassList();
    }
  });

  /** Подпись спасбросков персонажа. */
  const savingThrowsLabel = computed(() =>
    document.value.savingThrows
      .map((ability) => ABILITY_LABELS[ability].name)
      .join(', '),
  );

  /** Навыки, которыми персонаж уже владеет: для сверки с подсказкой. */
  const proficientSkillsLabel = computed(() =>
    SKILL_KEYS.filter(
      (key) => (document.value.skills[key] ?? 'none') !== 'none',
    )
      .map((key) => SKILL_INFO[key].names[0])
      .join(', '),
  );
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_LABELS.classes"
    :ui="{ content: 'max-w-xl', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <ul
        v-if="document.classes.length"
        class="flex flex-col gap-3"
      >
        <li
          v-for="sheetClass in document.classes"
          :key="sheetClass.id"
          class="flex flex-col gap-2 rounded-lg border border-default p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-highlighted">
              {{ sheetClass.name }}
            </span>

            <span class="text-sm text-muted">
              {{ SHEET_LABELS.hitDie }}: к{{ sheetClass.hitDie }}
            </span>

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="SHEET_LABELS.remove"
              color="error"
              variant="ghost"
              size="sm"
              @click.left.exact.prevent="removeClass(sheetClass.id)"
            />
          </div>

          <div class="grid grid-cols-[6rem_1fr] gap-2">
            <UFormField :label="SHEET_LABELS.level">
              <UInputNumber
                :model-value="sheetClass.level"
                :min="CHARACTER_LEVEL.min"
                :max="getMaxLevel(sheetClass)"
                @update:model-value="setLevel(sheetClass, $event)"
              />
            </UFormField>

            <UFormField :label="SHEET_LABELS.archetype">
              <USelect
                :model-value="sheetClass.archetypeUrl ?? NO_ARCHETYPE"
                :items="getArchetypeOptions(sheetClass)"
                :loading="isListLoading"
                class="w-full"
                @update:model-value="setArchetype(sheetClass, $event)"
              />
            </UFormField>
          </div>
        </li>
      </ul>

      <div
        v-if="canAdd"
        class="flex items-end gap-2"
      >
        <UFormField
          :label="SHEET_LABELS.addClass"
          class="flex-1"
        >
          <USelectMenu
            v-model="selectedClassUrl"
            :items="classOptions"
            value-key="value"
            :loading="isListLoading"
            class="w-full"
          />
        </UFormField>

        <UButton
          :label="SHEET_LABELS.add"
          :icon="SHEET_ICON.add"
          :loading="isAdding"
          :disabled="!selectedClassUrl"
          @click.left.exact.prevent="addClass"
        />
      </div>

      <div
        v-if="firstClassHint"
        class="flex flex-col gap-1 rounded-lg bg-elevated p-3 text-sm"
      >
        <p>
          <span class="text-muted">{{ SHEET_LABELS.savingThrows }}:</span>
          {{ savingThrowsLabel || firstClassHint.savingThrows }}
        </p>

        <p v-if="firstClassHint.skills">
          {{ firstClassHint.skills }}
        </p>

        <p v-if="proficientSkillsLabel">
          <span class="text-muted">{{ SHEET_LABELS.skills }}:</span>
          {{ proficientSkillsLabel }}
        </p>
      </div>
    </template>
  </UModal>
</template>
