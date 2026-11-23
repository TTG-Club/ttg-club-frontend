<script setup lang="ts">
  import type { SheetChoice, SheetDocument } from '../model';

  import { getApiErrorMessage } from '~user/model';

  import {
    answerSourceChoice,
    CHOICE_TEXT,
    findSource,
    getChoiceAnswers,
    getChoiceValueLabel,
    getSourceChoices,
    getSourceLevel,
    SHEET_TEXT,
    SOURCE_KIND_LABELS,
  } from '../model';
  import SheetChoicePickerModal from './SheetChoicePickerModal.vue';

  /**
   * Выборы источника механики и тех, кто появился из его выборов (черта
   * умения, вариант умения): подпись, сделанное и кнопка пикера. Работает на
   * любом документе — листе или черновике мастера — и отдаёт новый документ.
   */
  const {
    document,
    sourceId,
    isNested = false,
  } = defineProps<{
    document: SheetDocument;
    sourceId: string;
    isNested?: boolean;
  }>();

  const emit = defineEmits<{
    change: [document: SheetDocument];
  }>();

  /**
   * Цвет счётчика выбора: несделанный выбор — предупреждением.
   * @param isPending - выбор не сделан до конца
   */
  function getCounterColor(isPending: boolean): 'warning' | 'neutral' {
    return isPending ? 'warning' : 'neutral';
  }

  const toast = useToast();

  const pickedKey = ref<string | null>(null);
  const isSaving = ref(false);

  const source = computed(() => findSource(document, sourceId));

  const children = computed(() =>
    document.sources.filter((candidate) => candidate.parentId === sourceId),
  );

  /**
   * Подпись выбранного значения: заклинание и черта — по записи листа.
   * @param choice - выбор
   * @param value - значение
   */
  function getAnswerLabel(choice: SheetChoice, value: string): string {
    const listed = choice.options.find((option) => option.value === value);

    if (listed) {
      return listed.label;
    }

    const spell = document.spells.find(
      (candidate) => candidate.sourceId === sourceId && candidate.url === value,
    );

    const child = children.value.find((candidate) => candidate.url === value);

    return (
      spell?.name ?? child?.name ?? getChoiceValueLabel(choice.kind, value)
    );
  }

  const rows = computed(() => {
    const current = source.value;

    if (!current) {
      return [];
    }

    return getSourceChoices(current, getSourceLevel(document, current)).map(
      (choice) => {
        const answers = getChoiceAnswers(current, choice);

        const labels = Object.fromEntries(
          answers.map((value) => [value, getAnswerLabel(choice, value)]),
        );

        return {
          choice,
          answers,
          labels,
          badgeColor: getCounterColor(answers.length < choice.count),
          counter: `${answers.length} ${CHOICE_TEXT.of} ${choice.count}`,
        };
      },
    );
  });

  const isVisible = computed(
    () =>
      Boolean(source.value)
      && (rows.value.length > 0 || children.value.length > 0),
  );

  const picked = computed(
    () => rows.value.find((row) => row.choice.key === pickedKey.value) ?? null,
  );

  const isPickerOpen = computed({
    get: () => pickedKey.value !== null,
    set: (open: boolean) => {
      if (!open) {
        pickedKey.value = null;
      }
    },
  });

  const title = computed(() =>
    source.value
      ? `${SOURCE_KIND_LABELS[source.value.kind]}: ${source.value.name}`
      : '',
  );

  /**
   * Открывает пикер выбора.
   * @param key - ключ выбора
   */
  function openPicker(key: string): void {
    pickedKey.value = key;
  }

  /**
   * Применяет ответ на выбор.
   * @param values - выбранные значения
   * @param labels - подписи значений
   */
  async function confirm(
    values: Array<string>,
    labels: Record<string, string>,
  ): Promise<void> {
    const choice = picked.value?.choice;

    if (!choice) {
      return;
    }

    isSaving.value = true;

    try {
      emit(
        'change',
        await answerSourceChoice(document, sourceId, choice, values, labels),
      );
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Пробрасывает документ из вложенного источника.
   * @param next - новый документ
   */
  function forward(next: SheetDocument): void {
    emit('change', next);
  }
</script>

<template>
  <div
    v-if="isVisible"
    class="flex flex-col gap-2"
    :class="{ 'border-l-2 border-default/50 pl-3': isNested }"
  >
    <span
      v-if="isNested"
      class="text-xs font-bold text-muted"
    >
      {{ title }}
    </span>

    <div
      v-for="row in rows"
      :key="row.choice.key"
      class="flex flex-wrap items-center gap-2 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2"
    >
      <span class="text-sm font-medium text-highlighted">
        {{ row.choice.label }}
      </span>

      <UBadge
        :label="row.counter"
        :color="row.badgeColor"
        variant="subtle"
        size="sm"
      />

      <div class="flex grow flex-wrap gap-1">
        <UBadge
          v-for="value in row.answers"
          :key="value"
          :label="row.labels[value]"
          color="primary"
          variant="subtle"
          size="sm"
        />
      </div>

      <UButton
        :label="CHOICE_TEXT.choose"
        icon="tabler:list-check"
        color="neutral"
        variant="subtle"
        size="xs"
        :loading="isSaving"
        @click.left.exact.prevent="openPicker(row.choice.key)"
      />
    </div>

    <SheetSourceChoices
      v-for="child in children"
      :key="child.id"
      :document="document"
      :source-id="child.id"
      is-nested
      @change="forward"
    />

    <SheetChoicePickerModal
      v-if="picked && source"
      v-model:open="isPickerOpen"
      :document="document"
      :source="source"
      :choice="picked.choice"
      :answers="picked.answers"
      :answer-labels="picked.labels"
      @confirm="confirm"
    />
  </div>
</template>
