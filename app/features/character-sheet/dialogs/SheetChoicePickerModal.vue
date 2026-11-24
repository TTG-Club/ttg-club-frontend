<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    SheetChoice,
    SheetChoiceOption,
    SheetDocument,
    SheetSource,
  } from '../model';

  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';
  import {
    ContentEntityDrawer,
    ContentEntityPane,
  } from '~content/entity-drawer';

  import { useChoicePool } from '../composables';
  import { CHOICE_TEXT, SHEET_ICON } from '../model';

  /** Строка списка: вариант с состоянием выбора. */
  interface OptionRow {
    option: SheetChoiceOption;
    isSelected: boolean;
    isDisabled: boolean;
    isActive: boolean;
    icon: string;
    rowClass: string;
  }

  /** Группа списка: навыки одной характеристики и т. п. */
  interface OptionGroup {
    key: string;
    title: string;
    rows: Array<OptionRow>;
  }

  /** Что показывает список: все варианты или уже отмеченные. */
  type PickerView = 'all' | 'selected';

  /**
   * Единый пикер выбора, как в core-app: поиск, список группами, вкладки
   * «Все / Выбранные» и описание варианта — панелью рядом со списком на
   * широком экране и дровером на узком. Выбор правится черновиком и
   * сохраняется кнопкой.
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
  const localTerm = ref('');
  const activeView = ref<PickerView>('all');
  const activeValue = ref<string | null>(null);
  const drawerOption = ref<SheetChoiceOption | null>(null);

  const isWide = useMediaQuery(LAYOUT_DRAWER_QUERY);

  const { options, needsSearch, searchTerm, isLoading, reset } = useChoicePool(
    () => document,
    () => source,
    () => choice,
  );

  /** Поиск по справочнику или отбор среди перечисленных вариантов. */
  const term = computed({
    get: () => (needsSearch.value ? searchTerm.value : localTerm.value),
    set: (value: string) => {
      if (needsSearch.value) {
        searchTerm.value = value;
      } else {
        localTerm.value = value;
      }
    },
  });

  const searchPlaceholder = computed(() =>
    needsSearch.value
      ? CHOICE_TEXT.spellSearchHint
      : CHOICE_TEXT.searchPlaceholder,
  );

  const isMultiple = computed(() => choice.count !== 1);
  const isFull = computed(() => selected.value.length >= choice.count);

  /** Панель описания: только там, где у вариантов есть карточки. */
  const hasDetails = computed(() =>
    options.value.some((option) => option.detail !== undefined),
  );

  const isPaneVisible = computed(() => hasDetails.value && isWide.value);

  const modalUi = computed(() => ({
    content: hasDetails.value ? 'sm:max-w-4xl' : 'sm:max-w-lg',
    body: 'flex flex-col gap-3',
  }));

  const counter = computed(
    () =>
      `${CHOICE_TEXT.chosen}: ${selected.value.length} ${CHOICE_TEXT.of} ${choice.count}`,
  );

  const emptyText = computed(() =>
    isLoading.value ? CHOICE_TEXT.loading : CHOICE_TEXT.empty,
  );

  const filtered = computed(() => {
    const query = localTerm.value.trim().toLowerCase();

    if (needsSearch.value || !query) {
      return options.value;
    }

    return options.value.filter(
      (option) =>
        option.label.toLowerCase().includes(query)
        || (option.caption ?? '').toLowerCase().includes(query),
    );
  });

  const displayed = computed(() =>
    activeView.value === 'selected'
      ? filtered.value.filter((option) => selected.value.includes(option.value))
      : filtered.value,
  );

  const activeOption = computed(
    () =>
      options.value.find((option) => option.value === activeValue.value)
      ?? null,
  );

  /**
   * Строка списка для варианта.
   * @param option - вариант
   */
  function toRow(option: SheetChoiceOption): OptionRow {
    const isSelected = selected.value.includes(option.value);
    const isActive = isPaneVisible.value && option.value === activeValue.value;

    let checkIcon = isSelected ? 'tabler:circle-check' : 'tabler:circle';

    if (isMultiple.value) {
      checkIcon = isSelected ? 'tabler:square-check-filled' : 'tabler:square';
    }

    let rowClass = 'border-default/50 hover:border-primary/60';

    if (isActive) {
      rowClass = 'border-primary bg-elevated';
    } else if (isSelected) {
      rowClass = 'border-primary/60 bg-primary/10';
    }

    return {
      option,
      isSelected,
      isActive,
      isDisabled:
        !isSelected
        && (Boolean(option.disabled) || (isMultiple.value && isFull.value)),
      icon: checkIcon,
      rowClass,
    };
  }

  /** Группы в порядке первого появления. */
  const groups = computed<Array<OptionGroup>>(() => {
    const byKey = new Map<string, Array<OptionRow>>();

    for (const option of displayed.value) {
      const key = option.group ?? '';

      byKey.set(key, [...(byKey.get(key) ?? []), toRow(option)]);
    }

    return [...byKey.entries()].map(([key, rows]) => ({
      key,
      title: key,
      rows,
    }));
  });

  const viewItems = computed<Array<TabsItem>>(() => [
    { value: 'all', label: CHOICE_TEXT.allTab },
    {
      value: 'selected',
      label: CHOICE_TEXT.selectedTab,
      badge: {
        label: String(selected.value.length),
        color: 'neutral',
        variant: 'subtle',
      },
    },
  ]);

  /** Выбранные, которых нет в выдаче поиска справочника, — чтобы их снять. */
  const hiddenSelected = computed(() =>
    needsSearch.value
      ? selected.value
          .filter(
            (value) => !options.value.some((option) => option.value === value),
          )
          .map((value) => ({ value, label: labels.value[value] ?? value }))
      : [],
  );

  const isDrawerOpen = computed({
    get: () => drawerOption.value !== null,
    set: (open: boolean) => {
      if (!open) {
        drawerOption.value = null;
      }
    },
  });

  const drawerDetail = computed(() => drawerOption.value?.detail ?? null);

  // Окно часто монтируется уже открытым — черновик берётся сразу
  watch(
    isOpen,
    (open) => {
      if (open) {
        selected.value = [...answers];
        labels.value = { ...answerLabels };
        activeView.value = 'all';
        activeValue.value = answers[0] ?? options.value[0]?.value ?? null;
        localTerm.value = '';
      } else {
        reset();
      }
    },
    { immediate: true },
  );

  // Без выбора панель показывает первый вариант, а не пустоту
  watch(
    options,
    (list) => {
      if (!list.some((option) => option.value === activeValue.value)) {
        activeValue.value = list[0]?.value ?? null;
      }
    },
    { immediate: true },
  );

  /**
   * Отмечает или снимает вариант; отмеченный становится активным.
   * @param row - строка списка
   */
  function toggle(row: OptionRow): void {
    const { option } = row;

    activeValue.value = option.value;

    if (row.isSelected) {
      selected.value = selected.value.filter((value) => value !== option.value);

      return;
    }

    if (row.isDisabled) {
      return;
    }

    selected.value = isMultiple.value
      ? [...selected.value, option.value]
      : [option.value];

    labels.value = { ...labels.value, [option.value]: option.label };
  }

  /**
   * Показывает описание: панелью на широком экране, дровером на узком.
   * @param option - вариант
   */
  function showDetail(option: SheetChoiceOption): void {
    activeValue.value = option.value;

    if (!isPaneVisible.value) {
      drawerOption.value = option;
    }
  }

  /**
   * Снимает выбранное значение.
   * @param value - значение
   */
  function unselect(value: string): void {
    selected.value = selected.value.filter((item) => item !== value);
  }

  /**
   * Переключает вкладку списка.
   * @param value - значение вкладки
   */
  function changeView(value: string | number): void {
    activeView.value = value === 'selected' ? 'selected' : 'all';
  }

  function clear(): void {
    selected.value = [];
    activeView.value = 'all';
  }

  function cancel(): void {
    isOpen.value = false;
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
    :description="source.name"
    :ui="modalUi"
  >
    <template #body>
      <UInput
        v-model="term"
        :placeholder="searchPlaceholder"
        :icon="SHEET_ICON.search"
        :loading="isLoading"
        class="w-full"
      />

      <UTabs
        v-if="isMultiple"
        :items="viewItems"
        :model-value="activeView"
        :content="false"
        size="sm"
        :ui="{ list: 'w-full' }"
        @update:model-value="changeView"
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

      <div class="flex max-h-[60dvh] min-h-72 gap-4">
        <div
          class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto"
          :class="{ 'md:basis-5/12': isPaneVisible }"
        >
          <p
            v-if="!groups.length"
            class="py-6 text-center text-sm text-muted"
          >
            {{ emptyText }}
          </p>

          <div
            v-for="group in groups"
            :key="group.key"
            class="flex flex-col gap-1"
          >
            <div
              v-if="group.title"
              class="flex items-center gap-2 pt-1"
            >
              <span class="shrink-0 text-xs font-medium text-muted uppercase">
                {{ group.title }}
              </span>

              <div class="h-px grow bg-default/50" />
            </div>

            <div
              v-for="row in group.rows"
              :key="row.option.value"
              class="flex items-stretch gap-1"
            >
              <button
                type="button"
                class="flex min-w-0 grow items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                :class="row.rowClass"
                :disabled="row.isDisabled && !row.isSelected"
                :aria-pressed="row.isSelected"
                @click.left.exact.prevent="toggle(row)"
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

              <UTooltip
                v-if="row.option.detail"
                :text="CHOICE_TEXT.detailTooltip"
              >
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="subtle"
                  square
                  class="w-10 shrink-0 justify-center self-stretch"
                  :aria-label="CHOICE_TEXT.detailTooltip"
                  @click.left.exact.prevent="showDetail(row.option)"
                />
              </UTooltip>
            </div>
          </div>
        </div>

        <div
          v-if="isPaneVisible"
          class="flex min-h-0 min-w-0 basis-7/12 flex-col gap-2 overflow-y-auto rounded-md border border-default p-4"
        >
          <p
            v-if="!activeOption"
            class="grid grow place-items-center text-center text-sm text-dimmed"
          >
            {{ CHOICE_TEXT.detailPlaceholder }}
          </p>

          <template v-else>
            <h4 class="text-base font-semibold text-highlighted">
              {{ activeOption.label }}
            </h4>

            <ContentEntityPane
              v-if="activeOption.detail"
              :key="activeOption.detail.path"
              :type="activeOption.detail.type"
              :path="activeOption.detail.path"
            />

            <p
              v-else
              class="text-sm text-dimmed italic"
            >
              {{ CHOICE_TEXT.noDetail }}
            </p>
          </template>
        </div>
      </div>

      <ContentEntityDrawer
        v-if="drawerDetail && drawerOption"
        v-model:open="isDrawerOpen"
        :type="drawerDetail.type"
        :path="drawerDetail.path"
        :title="drawerOption.label"
      />
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-medium text-highlighted">{{ counter }}</span>

        <div class="ml-auto flex gap-2">
          <UButton
            v-if="selected.length"
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            :label="CHOICE_TEXT.clear"
            @click.left.exact.prevent="clear"
          />

          <UButton
            :label="CHOICE_TEXT.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="cancel"
          />

          <UButton
            :label="CHOICE_TEXT.save"
            @click.left.exact.prevent="confirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
