<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import {
    MAX_INITIATIVE_BONUS,
    MAX_PARTICIPANT_NAME_LENGTH,
    MAX_PLAYERS,
    MIN_INITIATIVE_BONUS,
  } from '@/features/initiative/model';

  const {
    disabled = false,
    loading = false,
    count = 0,
  } = defineProps<{
    disabled?: boolean;
    loading?: boolean;
    count?: number;
  }>();

  const emit = defineEmits<{
    add: [name: string, bonus: number];
  }>();

  const name = ref('');
  const bonus = ref(0);

  const canSubmit = computed(() => Boolean(name.value.trim()) && !disabled);

  function submit(): void {
    if (!canSubmit.value || loading) {
      return;
    }

    emit('add', name.value.trim(), bonus.value);
    name.value = '';
    bonus.value = 0;
  }
</script>

<template>
  <form
    class="add-form"
    @submit.prevent="submit"
  >
    <div class="add-form__header">
      <icon
        icon="tabler:user-plus"
        class="add-form__header-icon"
      />
      Игрок

      <span
        class="add-form__counter"
        :class="{ 'add-form__counter--limit': disabled }"
      >
        {{ count }} / {{ MAX_PLAYERS }}
      </span>
    </div>

    <div class="add-form__row">
      <label class="field field--grow">
        <span class="field__label">Имя игрока</span>

        <n-input
          v-model:value="name"
          placeholder="Арагорн"
          :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
          :disabled="disabled"
        />
      </label>

      <label class="field">
        <span class="field__label">Бонус</span>

        <n-input-number
          v-model:value="bonus"
          :min="MIN_INITIATIVE_BONUS"
          :max="MAX_INITIATIVE_BONUS"
          :disabled="disabled"
          class="add-form__bonus"
        />
      </label>

      <n-button
        attr-type="submit"
        type="primary"
        class="add-form__submit"
        :loading="loading"
        :disabled="!canSubmit || loading"
        aria-label="Добавить игрока"
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
      gap: 8px;
      align-items: flex-end;
    }

    &__bonus {
      width: 112px;
    }

    &__submit {
      flex-shrink: 0;
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
