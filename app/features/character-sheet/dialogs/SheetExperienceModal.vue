<script setup lang="ts">
  import type { SheetClass } from '../model';

  import {
    useCharacterSheet,
    useClassLevelActions,
    useSheetStats,
  } from '../composables';
  import {
    CHARACTER_LEVEL,
    EXPERIENCE_TEXT,
    getExperienceProgress,
    getLevelByExperience,
    LEVEL_UP_TEXT,
    SHEET_ICON,
  } from '../model';
  import SheetConfirmModal from './SheetConfirmModal.vue';

  /**
   * Опыт и уровень, как на new.ttg.club: путь к следующему уровню, правка
   * опыта и «получить опыт» прибавкой, подсказка, когда опыта хватает на
   * повышение, и уровни классов — повышение (мастер) и понижение прямо отсюда.
   * Получать опыт можно и на запертом листе, уровни правятся на отпертом.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const emit = defineEmits<{
    /** У персонажа нет класса — открыть выбор класса. */
    'pick-class': [];
  }>();

  const { document, update, ensureEditable } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { levelUp, levelDown } = useClassLevelActions();

  const gain = ref<number | null>(null);
  const levelDownId = ref<string | null>(null);

  watch(isOpen, (open) => {
    if (open) {
      gain.value = null;
    }
  });

  const level = computed(() => stats.value.level);

  const progress = computed(() =>
    getExperienceProgress(document.value.experience, level.value),
  );

  const barWidth = computed(() => `${progress.value.percent}%`);

  const progressLabel = computed(() =>
    progress.value.to === null
      ? EXPERIENCE_TEXT.maxLevel
      : `${EXPERIENCE_TEXT.remaining}: ${progress.value.remaining}`,
  );

  const experienceLabel = computed(
    () => `${document.value.experience} / ${progress.value.to ?? '—'}`,
  );

  const experienceLevel = computed(() =>
    getLevelByExperience(document.value.experience),
  );

  const hasClasses = computed(() => document.value.classes.length > 0);

  const isReady = computed(
    () => hasClasses.value && experienceLevel.value > level.value,
  );

  const readyDescription = computed(
    () =>
      `${EXPERIENCE_TEXT.readyDescription} ${experienceLevel.value}. ${EXPERIENCE_TEXT.readyHint}`,
  );

  const canLevelUp = computed(() => level.value < CHARACTER_LEVEL.max);

  const classRows = computed(() =>
    document.value.classes.map((sheetClass) => ({
      sheetClass,
      title: sheetClass.archetypeName
        ? `${sheetClass.name} (${sheetClass.archetypeName})`
        : sheetClass.name,
      level: sheetClass.level,
    })),
  );

  const isConfirmOpen = computed({
    get: () => levelDownId.value !== null,
    set: (open: boolean) => {
      if (!open) {
        levelDownId.value = null;
      }
    },
  });

  /**
   * Записанный опыт.
   * @param value - очки опыта
   */
  function setExperience(value: number | null): void {
    update((current) => ({
      ...current,
      experience: Math.max(0, Math.trunc(value ?? 0)),
    }));
  }

  function applyGain(): void {
    const value = Math.trunc(gain.value ?? 0);

    if (value) {
      setExperience(document.value.experience + value);
    }

    gain.value = null;
  }

  /**
   * Повышает уровень класса; мастер открывается вместо этого окна.
   * @param sheetClass - класс листа
   */
  function raise(sheetClass: SheetClass): void {
    if (!ensureEditable()) {
      return;
    }

    if (levelUp(sheetClass)) {
      isOpen.value = false;
    }
  }

  /**
   * Просит подтвердить понижение уровня класса.
   * @param classId - класс листа
   */
  function askLevelDown(classId: string): void {
    if (ensureEditable()) {
      levelDownId.value = classId;
    }
  }

  function confirmLevelDown(): void {
    if (levelDownId.value) {
      levelDown(levelDownId.value);
    }
  }

  function pickClass(): void {
    if (!ensureEditable()) {
      return;
    }

    isOpen.value = false;
    emit('pick-class');
  }

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="EXPERIENCE_TEXT.title"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
          <div class="flex items-end justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ EXPERIENCE_TEXT.level }}
              </span>

              <span
                class="text-3xl leading-none font-bold text-highlighted tabular-nums"
              >
                {{ level }}
              </span>
            </div>

            <span class="text-sm text-toned tabular-nums">
              {{ experienceLabel }}
            </span>
          </div>

          <span class="h-1.5 overflow-hidden rounded-full bg-elevated">
            <span
              class="block h-full rounded-full bg-primary transition-[width] duration-300"
              :style="{ width: barWidth }"
            />
          </span>

          <span class="text-[10px] text-dimmed">{{ progressLabel }}</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="EXPERIENCE_TEXT.experience">
            <UInputNumber
              :model-value="document.experience"
              :min="0"
              class="w-full"
              @update:model-value="setExperience"
            />
          </UFormField>

          <UFormField
            :label="EXPERIENCE_TEXT.gain"
            :help="EXPERIENCE_TEXT.gainHint"
          >
            <UFieldGroup class="w-full">
              <UInputNumber
                v-model="gain"
                :placeholder="EXPERIENCE_TEXT.gainPlaceholder"
                :increment="false"
                :decrement="false"
                class="min-w-0 grow"
                @keydown.enter.prevent="applyGain"
              />

              <UButton
                :icon="SHEET_ICON.add"
                :aria-label="EXPERIENCE_TEXT.gainApply"
                color="neutral"
                variant="subtle"
                :disabled="!gain"
                @click.left.exact.prevent="applyGain"
              />
            </UFieldGroup>
          </UFormField>
        </div>

        <UAlert
          v-if="isReady"
          icon="tabler:arrow-big-up-lines"
          color="primary"
          variant="subtle"
          :title="EXPERIENCE_TEXT.readyTitle"
          :description="readyDescription"
        />

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ EXPERIENCE_TEXT.classes }}
          </span>

          <div
            v-for="row in classRows"
            :key="row.sheetClass.id"
            class="flex items-center gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
          >
            <span
              class="min-w-0 grow truncate text-sm font-semibold text-highlighted"
            >
              {{ row.title }}
            </span>

            <span class="text-lg font-bold text-highlighted tabular-nums">
              {{ row.level }}
            </span>

            <UTooltip :text="LEVEL_UP_TEXT.levelDown">
              <UButton
                icon="tabler:arrow-big-down-lines"
                :aria-label="LEVEL_UP_TEXT.levelDown"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                @click.left.exact.prevent="askLevelDown(row.sheetClass.id)"
              />
            </UTooltip>

            <UTooltip :text="LEVEL_UP_TEXT.levelUp">
              <UButton
                icon="tabler:arrow-big-up-lines"
                :aria-label="LEVEL_UP_TEXT.levelUp"
                :variant="isReady ? 'solid' : 'soft'"
                size="sm"
                square
                :disabled="!canLevelUp"
                @click.left.exact.prevent="raise(row.sheetClass)"
              />
            </UTooltip>
          </div>

          <template v-if="!hasClasses">
            <p class="text-xs text-dimmed">{{ EXPERIENCE_TEXT.noClasses }}</p>

            <UButton
              :label="EXPERIENCE_TEXT.pickClass"
              :icon="SHEET_ICON.add"
              color="neutral"
              variant="outline"
              class="self-start"
              @click.left.exact.prevent="pickClass"
            />
          </template>
        </div>

        <SheetConfirmModal
          v-model:open="isConfirmOpen"
          :title="LEVEL_UP_TEXT.removeLevelTitle"
          :description="LEVEL_UP_TEXT.removeLevelDescription"
          @confirm="confirmLevelDown"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          :label="EXPERIENCE_TEXT.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />
      </div>
    </template>
  </UModal>
</template>
