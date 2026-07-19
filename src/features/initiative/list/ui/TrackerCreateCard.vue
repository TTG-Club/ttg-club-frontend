<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import {
    DEFAULT_TRACKER_NAME,
    MAX_D20,
    MAX_TRACKER_NAME_LENGTH,
  } from '@/features/initiative/model';
  import { InitiativeDie } from '@/features/initiative/ui-kit';

  const {
    loading = false,
    disabled = false,
    submitLabel = 'Создать трекер',
    heading = 'Новый трекер инициативы',
    description = 'Соберите энкаунтер и одной кнопкой прокиньте инициативу всем участникам.',
    placeholder = DEFAULT_TRACKER_NAME,
    hideName = false,
  } = defineProps<{
    loading?: boolean;
    disabled?: boolean;
    submitLabel?: string;
    heading?: string;
    description?: string;
    placeholder?: string;
    /** Скрыть поле имени (анониму название боя не нужно). */
    hideName?: boolean;
  }>();

  const emit = defineEmits<{
    create: [name: string];
  }>();

  const name = ref('');

  function submit(): void {
    if (disabled || loading) {
      return;
    }

    emit('create', name.value.trim());
  }
</script>

<template>
  <div class="create-card">
    <div class="create-card__head">
      <div class="create-card__die">
        <initiative-die
          :value="MAX_D20"
          size="lg"
        />
      </div>

      <div class="create-card__text">
        <h3 class="create-card__heading">{{ heading }}</h3>

        <p class="create-card__description">{{ description }}</p>
      </div>

      <!-- Кнопка сборки — действие в шапке, в одну линию с заголовком. -->
      <n-button
        type="primary"
        size="large"
        class="create-card__submit"
        :loading="loading"
        :disabled="disabled"
        @click="submit"
      >
        <template #icon>
          <icon icon="tabler:swords" />
        </template>
        {{ submitLabel }}
      </n-button>
    </div>

    <!-- Необязательное имя боя отдельной строкой (скрывается через hideName). -->
    <form
      v-if="!hideName"
      @submit.prevent="submit"
    >
      <n-input
        v-model:value="name"
        :maxlength="MAX_TRACKER_NAME_LENGTH"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        size="large"
      />
    </form>

    <slot name="footer" />
  </div>
</template>

<style scoped lang="scss">
  .create-card {
    display: flex;
    flex-direction: column;
    gap: 16px;

    padding: 16px;

    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary) 15%, transparent);

    @include media-min($sm) {
      padding: 24px;
    }

    &__head {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    &__die {
      display: none;
      flex-shrink: 0;
      place-items: center;

      padding: 10px;

      background-color: color-mix(in srgb, var(--primary) 5%, transparent);
      border-radius: 12px;

      @include media-min($sm) {
        display: grid;
      }
    }

    &__text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    &__heading {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-title);
    }

    &__description {
      margin: 0;
      font-size: 14px;
      color: var(--text-g-color);
    }

    &__submit {
      flex-shrink: 0;
      justify-content: center;
      margin-left: auto;
      transition: transform 0.15s ease-in-out;

      &:hover {
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
</style>
