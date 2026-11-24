<script setup lang="ts">
  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

  import { useLevelUpWizard } from '../composables';
  import { LEVEL_UP_RAIL_CLASSES, LEVEL_UP_TEXT, SHEET_ICON } from '../model';
  import SheetLevelUpStepBody from './SheetLevelUpStepBody.vue';

  /**
   * Мастер повышения уровня: рельса взятых уровней (на телефоне — короткая
   * строка «шаг k из n»), тело текущего шага и «Ещё уровень» с выбором
   * класса — за один заход можно поднять несколько классов. Изменения
   * копятся в черновике и переносятся в лист кнопкой «Применить».
   */
  const wizard = useLevelUpWizard();

  const { isOpen, isLoading, currentStep, steps, classOptions, canAddStep } =
    wizard;

  const isWide = useMediaQuery(LAYOUT_DRAWER_QUERY);

  /** Класс, которому достанется следующий уровень. */
  const nextClassId = ref<string | undefined>(undefined);

  const rail = computed(() =>
    steps.value.map((step, index) => ({
      key: `${index}:${step.classId}`,
      label: `${step.className} ${step.classLevel}`,
      railClass:
        index === steps.value.length - 1
          ? LEVEL_UP_RAIL_CLASSES.current
          : LEVEL_UP_RAIL_CLASSES.done,
    })),
  );

  const compactRail = computed(() => {
    const step = currentStep.value;

    return step
      ? `${LEVEL_UP_TEXT.stepOf} ${steps.value.length}: ${step.className} ${step.classLevel}`
      : '';
  });

  // Следующий уровень по умолчанию — тому же классу, что и текущий шаг
  watch(
    () => currentStep.value?.classId,
    (classId) => {
      if (classId) {
        nextClassId.value = classId;
      }
    },
    { immediate: true },
  );

  function addLevel(): void {
    if (nextClassId.value) {
      void wizard.addStep(nextClassId.value);
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="LEVEL_UP_TEXT.title"
    :dismissible="false"
    :ui="{ content: 'sm:max-w-3xl', body: 'flex flex-col gap-4' }"
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
        <div
          v-if="isWide"
          class="flex flex-wrap gap-1"
        >
          <span
            v-for="item in rail"
            :key="item.key"
            class="rounded-md border px-2 py-1 text-xs font-bold"
            :class="item.railClass"
          >
            {{ item.label }}
          </span>
        </div>

        <p
          v-else
          class="text-sm font-semibold text-highlighted"
        >
          {{ compactRail }}
        </p>

        <SheetLevelUpStepBody />

        <div
          v-if="canAddStep"
          class="flex flex-wrap items-end gap-2 border-t border-default/50 pt-3"
        >
          <UFormField :label="LEVEL_UP_TEXT.nextClass">
            <USelect
              v-model="nextClassId"
              :items="classOptions"
              class="w-48"
            />
          </UFormField>

          <UButton
            :label="LEVEL_UP_TEXT.addLevel"
            :icon="SHEET_ICON.add"
            color="neutral"
            variant="outline"
            :loading="isLoading"
            :disabled="!nextClassId"
            @click.left.exact.prevent="addLevel"
          />
        </div>

        <p class="text-xs text-dimmed">
          {{ LEVEL_UP_TEXT.pendingChoices }}
        </p>
      </template>
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
            :label="LEVEL_UP_TEXT.apply"
            :disabled="!currentStep"
            @click.left.exact.prevent="wizard.apply()"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
