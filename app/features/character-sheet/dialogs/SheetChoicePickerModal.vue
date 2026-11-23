<script setup lang="ts">
  import type {
    SheetChoice,
    SheetChoiceOption,
    SheetDocument,
    SheetSource,
  } from '../model';

  import { useChoicePool } from '../composables';
  import { CHOICE_TEXT, SHEET_ICON } from '../model';

  /**
   * Единый пикер выбора: варианты с пометками того, что у персонажа уже
   * есть, поиск по справочнику для заклинаний, черт и особенностей, предел
   * количества. Выбор подтверждается кнопкой.
   */
  const { document, source, choice, answers, answerLabels } = defineProps<{
    document: SheetDocument;
    source: SheetSource;
    choice: SheetChoice;
    answers: ReadonlyArray<string>;
    /** Подписи уже выбранных значений (названия заклинаний и черт). */
    answerLabels: Readonly<Record<string, string>>;
  }>();

  const emit = defineEmits<{
    confirm: [values: Array<string>, labels: Record<string, string>];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const selected = ref<Array<string>>([]);
  const labels = ref<Record<string, string>>({});

  const { options, needsSearch, searchTerm, isLoading, reset } = useChoicePool(
    () => document,
    () => source,
    () => choice,
  );

  const counter = computed(
    () =>
      `${CHOICE_TEXT.chosen}: ${selected.value.length} ${CHOICE_TEXT.of} ${choice.count}`,
  );

  const emptyText = computed(() =>
    isLoading.value ? CHOICE_TEXT.loading : CHOICE_TEXT.empty,
  );

  const isFull = computed(() => selected.value.length >= choice.count);

  const rows = computed(() =>
    options.value.map((option) => {
      const isSelected = selected.value.includes(option.value);

      return {
        option,
        isSelected,
        icon: isSelected ? 'tabler:square-check-filled' : 'tabler:square',
        isDisabled: !isSelected && (Boolean(option.disabled) || isFull.value),
        rowClass: isSelected
          ? 'border-primary/60 bg-primary/10'
          : 'border-default/50 hover:border-primary/60',
      };
    }),
  );

  /** Выбранные, которых нет в текущей выдаче поиска, — чтобы их можно было снять. */
  const hiddenSelected = computed(() =>
    selected.value
      .filter(
        (value) => !options.value.some((option) => option.value === value),
      )
      .map((value) => ({ value, label: labels.value[value] ?? value })),
  );

  watch(isOpen, (open) => {
    if (open) {
      selected.value = [...answers];
      labels.value = { ...answerLabels };
    } else {
      reset();
    }
  });

  /**
   * Отмечает или снимает вариант.
   * @param option - вариант
   */
  function toggle(option: SheetChoiceOption): void {
    if (selected.value.includes(option.value)) {
      selected.value = selected.value.filter((value) => value !== option.value);

      return;
    }

    if (choice.count === 1) {
      selected.value = [option.value];
    } else if (!isFull.value) {
      selected.value = [...selected.value, option.value];
    }

    labels.value = { ...labels.value, [option.value]: option.label };
  }

  /**
   * Снимает выбранное значение.
   * @param value - значение
   */
  function unselect(value: string): void {
    selected.value = selected.value.filter((item) => item !== value);
  }

  function confirm(): void {
    emit('confirm', [...selected.value], { ...labels.value });
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="choice.label"
    :description="counter"
    :ui="{ content: 'max-w-lg', body: 'flex flex-col gap-3' }"
  >
    <template #body>
      <UInput
        v-if="needsSearch"
        v-model="searchTerm"
        :placeholder="CHOICE_TEXT.spellSearchHint"
        :icon="SHEET_ICON.search"
        :loading="isLoading"
        autofocus
        class="w-full"
      />

      <div
        v-if="hiddenSelected.length"
        class="flex flex-wrap gap-1.5"
      >
        <UBadge
          v-for="item in hiddenSelected"
          :key="item.value"
          :label="item.label"
          color="primary"
          variant="subtle"
          trailing-icon="tabler:x"
          class="cursor-pointer"
          @click.left.exact.prevent="unselect(item.value)"
        />
      </div>

      <ul
        v-if="rows.length"
        class="flex max-h-96 flex-col gap-1 overflow-y-auto"
      >
        <li
          v-for="row in rows"
          :key="row.option.value"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="row.rowClass"
            :disabled="row.isDisabled"
            @click.left.exact.prevent="toggle(row.option)"
          >
            <UIcon
              :name="row.icon"
              class="size-4 shrink-0 text-primary"
            />

            <span class="flex min-w-0 grow flex-col">
              <span class="truncate text-sm text-highlighted">{{
                row.option.label
              }}</span>

              <span
                v-if="row.option.caption"
                class="truncate text-xs text-dimmed"
              >
                {{ row.option.caption }}
              </span>
            </span>

            <UBadge
              v-if="row.option.hint"
              :label="row.option.hint"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </button>
        </li>
      </ul>

      <p
        v-else
        class="py-6 text-center text-sm text-muted"
      >
        {{ emptyText }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          :label="CHOICE_TEXT.done"
          @click.left.exact.prevent="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
