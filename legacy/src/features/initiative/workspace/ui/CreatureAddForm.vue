<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { NTag } from 'naive-ui';
  import { h } from 'vue';

  import { useCreatureSearch } from '@/features/initiative/composables';
  import type { CreatureOption } from '@/features/initiative/model';
  import {
    MAX_CREATURES,
    MAX_PARTICIPANT_NAME_LENGTH,
    MIN_CREATURE_BATCH,
  } from '@/features/initiative/model';

  import type { SelectOption } from 'naive-ui';

  const {
    disabled = false,
    loading = false,
    remaining = 0,
    count = 0,
  } = defineProps<{
    disabled?: boolean;
    loading?: boolean;
    remaining?: number;
    count?: number;
  }>();

  const emit = defineEmits<{
    add: [url: string, count: number, name?: string];
  }>();

  const { searchTerm, options, isLoading } = useCreatureSearch();

  const selected = ref<CreatureOption | undefined>(undefined);
  const batchCount = ref(1);
  const nameOverride = ref('');

  type CreatureSelectOption = SelectOption & { rating: string };

  /** Опция автокомплита существа. */
  function toSelectOption(creature: CreatureOption): CreatureSelectOption {
    return {
      label: creature.label,
      value: creature.url,
      rating: creature.challengeRating,
    };
  }

  // Держим выбранную опцию в списке, даже когда поиск сменился и её там уже нет,
  // — иначе naive-ui не сможет показать подпись выбранного существа.
  const selectOptions = computed<Array<CreatureSelectOption>>(() => {
    const base = options.value.map(toSelectOption);

    if (
      selected.value &&
      !base.some((option) => option.value === selected.value!.url)
    ) {
      base.unshift(toSelectOption(selected.value));
    }

    return base;
  });

  const selectedValue = computed(() => selected.value?.url ?? null);

  const maxCount = computed(() => Math.max(MIN_CREATURE_BATCH, remaining));

  const canSubmit = computed(
    () => Boolean(selected.value) && !disabled && remaining > 0,
  );

  const emptyLabel = computed(() =>
    searchTerm.value.trim()
      ? 'Ничего не найдено'
      : 'Начните вводить название существа',
  );

  /** Подпись существа со значком показателя опасности справа. */
  function renderLabel(option: SelectOption) {
    const { rating } = option as CreatureSelectOption;

    return h('div', { class: 'creature-form__option' }, [
      h(
        'span',
        { class: 'creature-form__option-name' },
        option.label as string,
      ),
      rating
        ? h(NTag, { size: 'small', bordered: false }, () => `ПО ${rating}`)
        : null,
    ]);
  }

  function onSelect(value: string | null): void {
    selected.value = value
      ? (options.value.find((creature) => creature.url === value) ??
        selected.value)
      : undefined;
  }

  // Держим количество в пределах оставшихся мест.
  watch(
    () => remaining,
    (value) => {
      if (batchCount.value > value) {
        batchCount.value = Math.max(MIN_CREATURE_BATCH, value);
      }
    },
  );

  function submit(): void {
    if (!canSubmit.value || loading || !selected.value) {
      return;
    }

    const override = nameOverride.value.trim();

    emit('add', selected.value.url, batchCount.value, override || undefined);

    selected.value = undefined;
    searchTerm.value = '';
    nameOverride.value = '';
    batchCount.value = 1;
  }
</script>

<template>
  <form
    class="add-form"
    @submit.prevent="submit"
  >
    <div class="add-form__header">
      <icon
        icon="tabler:paw"
        class="add-form__header-icon"
      />
      Существа из бестиария

      <span
        class="add-form__counter"
        :class="{ 'add-form__counter--limit': disabled }"
      >
        {{ count }} / {{ MAX_CREATURES }}
      </span>
    </div>

    <div class="add-form__row">
      <label class="field field--grow creature-form__search">
        <span class="field__label">Существо</span>

        <n-select
          :value="selectedValue"
          :options="selectOptions"
          :loading="isLoading"
          :render-label="renderLabel"
          :disabled="disabled"
          filterable
          remote
          clearable
          placeholder="Найти существо…"
          @search="searchTerm = $event"
          @update:value="onSelect"
        >
          <template #empty>
            <span class="creature-form__empty">{{ emptyLabel }}</span>
          </template>
        </n-select>
      </label>

      <label class="field field--grow creature-form__name">
        <span class="field__label">Имя (необязательно)</span>

        <n-input
          v-model:value="nameOverride"
          placeholder="Базовое имя из статблока"
          :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
          :disabled="disabled"
        />
      </label>

      <label class="field">
        <span class="field__label">Количество</span>

        <n-input-number
          v-model:value="batchCount"
          :min="MIN_CREATURE_BATCH"
          :max="maxCount"
          :disabled="disabled || remaining < 1"
          class="creature-form__count"
        />
      </label>

      <n-button
        attr-type="submit"
        type="primary"
        class="add-form__submit"
        :loading="loading"
        :disabled="!canSubmit || loading"
        aria-label="Добавить существ"
      >
        <template #icon>
          <icon icon="tabler:plus" />
        </template>
      </n-button>
    </div>
  </form>
</template>

<style scoped lang="scss">
  .add-form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 16px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;

    &__header {
      display: flex;
      gap: 8px;
      align-items: center;

      font-size: 14px;
      font-weight: 600;
      color: var(--text-color-title);
    }

    &__header-icon {
      width: 20px;
      height: 20px;
      color: var(--primary);
    }

    &__counter {
      flex-shrink: 0;

      margin-left: auto;

      font-size: 12px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      color: var(--text-g-color);

      &--limit {
        color: var(--error);
      }
    }

    &__row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-end;
    }

    &__submit {
      flex-shrink: 0;
    }
  }

  .creature-form {
    &__search {
      min-width: 192px;
    }

    &__name {
      min-width: 160px;
    }

    &__count {
      width: 112px;
    }

    &__empty {
      font-size: 14px;
      color: var(--text-g-color);
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &--grow {
      flex: 1 1 auto;
      min-width: 0;
    }

    &__label {
      font-size: 12px;
      color: var(--text-g-color);
    }
  }
</style>

<style lang="scss">
  .creature-form__option {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .creature-form__option-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
