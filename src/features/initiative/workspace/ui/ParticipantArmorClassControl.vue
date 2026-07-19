<script setup lang="ts">
  import { clamp } from 'lodash-es';

  import {
    DEFAULT_ARMOR_CLASS,
    MAX_ARMOR_CLASS,
    MIN_ARMOR_CLASS,
  } from '@/features/initiative/model';

  import ParticipantStatTile from './ParticipantStatTile.vue';

  const { current = undefined, disabled = false } = defineProps<{
    /** КД игрока (нет записи — не задан, в плитке прочерк). */
    current?: number;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    change: [value: number];
  }>();

  const isOpen = ref(false);

  const display = computed(() =>
    current !== undefined ? String(current) : '—',
  );

  const draft = ref<number | null>(DEFAULT_ARMOR_CLASS);

  // Черновик следует за актуальным значением при каждом открытии попапа.
  watch(
    () => isOpen.value,
    (open) => {
      if (open) {
        draft.value = current ?? DEFAULT_ARMOR_CLASS;
      }
    },
  );

  /** Применяет КД из черновика; пустое поле закрывает попап без изменений. */
  function applyDraft(): void {
    isOpen.value = false;

    if (typeof draft.value !== 'number') {
      return;
    }

    const clamped = clamp(draft.value, MIN_ARMOR_CLASS, MAX_ARMOR_CLASS);

    if (clamped !== current) {
      emit('change', clamped);
    }
  }
</script>

<template>
  <n-popover
    v-model:show="isOpen"
    trigger="click"
    placement="bottom"
    :show-arrow="false"
    raw
    :disabled="disabled"
  >
    <template #trigger>
      <!-- Триггер — плитка КД: клик открывает попап ввода значения. -->
      <button
        type="button"
        class="ac-control__trigger"
        :disabled="disabled"
        aria-label="Изменить КД"
      >
        <participant-stat-tile
          label="КД"
          class="ac-control__tile"
        >
          {{ display }}
        </participant-stat-tile>
      </button>
    </template>

    <div class="ac-control__popup">
      <n-input-number
        v-model:value="draft"
        :min="MIN_ARMOR_CLASS"
        :max="MAX_ARMOR_CLASS"
        class="ac-control__input"
        aria-label="КД игрока"
        @keydown.enter.prevent="applyDraft"
      />

      <n-button
        secondary
        @click="applyDraft"
      >
        ОК
      </n-button>
    </div>
  </n-popover>
</template>

<style scoped lang="scss">
  .ac-control {
    &__trigger {
      cursor: pointer;

      display: block;

      width: 100%;
      padding: 0;

      background: transparent;
      border: none;
      border-radius: 8px;

      transition: opacity 0.15s ease-in-out;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &__tile {
      width: 100%;
      transition: border-color 0.15s ease-in-out;
    }

    &__trigger:not(:disabled):hover &__tile {
      border-color: var(--border-hover);
    }

    &__popup {
      display: flex;
      gap: 8px;
      align-items: center;

      width: 176px;
      padding: 12px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__input {
      flex: 1 1 auto;
    }
  }
</style>
