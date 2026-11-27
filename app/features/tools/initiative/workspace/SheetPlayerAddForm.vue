<script setup lang="ts">
  import type { SheetPlayerOption } from '../model';

  import { useSheetPlayerOptions } from '../composables';
  import {
    INITIATIVE_ICON,
    INITIATIVE_TEXT,
    SHEET_PLAYER_ICON,
    SHEET_PLAYER_SOURCE_LABEL,
    SHEET_PLAYER_TEXT,
  } from '../model';

  /** Строка списка листов: сам лист и пометки для неё. */
  interface SheetPlayerItem {
    /** Идентификатор листа — значение списка. */
    value: string;
    label: string;
    /** Классы с уровнями. */
    hint: string;
    /** Свой лист или сохранённый чужой. */
    badge: string;
    /** Персонаж этого листа уже стоит в бою. */
    isAdded: boolean;
  }

  /**
   * Добавление игрока из листа персонажа: имя, КД, бонус инициативы и хиты
   * берутся из листа. Видно только вошедшему — листы есть только у него.
   */
  const {
    isDisabled = false,
    isLimited = false,
    linkedSheetIds,
  } = defineProps<{
    isDisabled?: boolean;
    /** Игроков уже максимум. */
    isLimited?: boolean;
    /** Листы, персонажи которых уже в бою. */
    linkedSheetIds: ReadonlySet<string>;
  }>();

  const emit = defineEmits<{
    add: [option: SheetPlayerOption];
  }>();

  const { options, isLoading, hasError, isLoggedIn, load } =
    useSheetPlayerOptions();

  const selectedSheetId = ref<string>();

  const items = computed<Array<SheetPlayerItem>>(() =>
    options.value.map((option) => ({
      value: option.sheetId,
      label: option.name,
      hint: option.subtitle,
      badge: SHEET_PLAYER_SOURCE_LABEL[option.source],
      isAdded: linkedSheetIds.has(option.sheetId),
    })),
  );

  const isEmpty = computed(() => !isLoading.value && !items.value.length);

  const selectedOption = computed(() =>
    options.value.find((option) => option.sheetId === selectedSheetId.value),
  );

  const isSubmitDisabled = computed(
    () => isDisabled || isLimited || !selectedOption.value,
  );

  /** Пояснение под полем: отказ загрузки или пустой список. */
  const notice = computed(() => {
    if (hasError.value) {
      return { text: SHEET_PLAYER_TEXT.error, toneClass: 'text-error' };
    }

    return isEmpty.value
      ? { text: SHEET_PLAYER_TEXT.empty, toneClass: 'text-muted' }
      : undefined;
  });

  function submit(): void {
    const option = selectedOption.value;

    if (isSubmitDisabled.value || !option) {
      return;
    }

    emit('add', option);

    selectedSheetId.value = undefined;
  }
</script>

<template>
  <form
    v-if="isLoggedIn"
    class="flex flex-col gap-3"
    @submit.prevent="submit"
  >
    <div class="flex items-center gap-1 text-sm font-semibold">
      <UIcon
        :name="SHEET_PLAYER_ICON.sheet"
        class="size-5 text-primary"
      />

      {{ SHEET_PLAYER_TEXT.title }}

      <UTooltip :text="SHEET_PLAYER_TEXT.hint">
        <UButton
          :icon="SHEET_PLAYER_ICON.hint"
          :aria-label="SHEET_PLAYER_TEXT.hint"
          color="neutral"
          variant="ghost"
          size="xs"
        />
      </UTooltip>

      <UTooltip :text="SHEET_PLAYER_TEXT.refresh">
        <UButton
          :icon="SHEET_PLAYER_ICON.refresh"
          :aria-label="SHEET_PLAYER_TEXT.refresh"
          :loading="isLoading"
          color="neutral"
          variant="ghost"
          size="xs"
          class="ml-auto"
          @click.left.exact.prevent="load"
        />
      </UTooltip>
    </div>

    <UFormField :label="SHEET_PLAYER_TEXT.field">
      <USelectMenu
        v-model="selectedSheetId"
        :items="items"
        value-key="value"
        :placeholder="SHEET_PLAYER_TEXT.placeholder"
        :search-input="{ placeholder: SHEET_PLAYER_TEXT.search }"
        :loading="isLoading"
        :disabled="isLimited || isEmpty"
        :icon="SHEET_PLAYER_ICON.sheet"
        class="w-full"
      >
        <template #item-label="{ item }">
          <span class="flex min-w-0 flex-col text-left">
            <span class="truncate">{{ item.label }}</span>

            <span class="truncate text-xs text-muted">{{ item.hint }}</span>
          </span>
        </template>

        <template #item-trailing="{ item }">
          <UBadge
            v-if="item.isAdded"
            :label="SHEET_PLAYER_TEXT.added"
            size="sm"
            color="neutral"
            variant="subtle"
          />

          <UBadge
            :label="item.badge"
            size="sm"
            color="neutral"
            variant="outline"
          />
        </template>

        <template #empty>
          {{ SHEET_PLAYER_TEXT.empty }}
        </template>
      </USelectMenu>
    </UFormField>

    <p
      v-if="notice"
      class="text-sm"
      :class="notice.toneClass"
    >
      {{ notice.text }}
    </p>

    <p
      v-if="isLimited"
      class="text-sm text-warning"
    >
      {{ INITIATIVE_TEXT.playersLimit }}
    </p>

    <UButton
      type="submit"
      :label="SHEET_PLAYER_TEXT.submit"
      :icon="INITIATIVE_ICON.add"
      :disabled="isSubmitDisabled"
      color="neutral"
      variant="subtle"
      block
    />
  </form>
</template>
