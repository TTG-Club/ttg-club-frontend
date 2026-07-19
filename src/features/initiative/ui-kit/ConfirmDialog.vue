<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import type { ButtonProps } from 'naive-ui';

  const open = defineModel<boolean>('open', { default: false });

  const {
    title,
    description = undefined,
    confirmLabel = 'Подтвердить',
    confirmColor = 'primary',
    confirmIcon = undefined,
    loading = false,
  } = defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;
    confirmColor?: 'primary' | 'error' | 'warning' | 'success' | 'neutral';
    confirmIcon?: string;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    confirm: [];
  }>();

  /** КД-цвет диалога → тип кнопки naive-ui. */
  const confirmType = computed<ButtonProps['type']>(() =>
    confirmColor === 'neutral' ? 'default' : confirmColor,
  );

  function cancel(): void {
    open.value = false;
  }

  function confirm(): void {
    emit('confirm');
  }
</script>

<template>
  <n-modal
    v-model:show="open"
    preset="card"
    :title="title"
    :bordered="false"
    class="confirm-dialog"
    size="small"
  >
    <p
      v-if="description"
      class="confirm-dialog__description"
    >
      {{ description }}
    </p>

    <template #footer>
      <div class="confirm-dialog__actions">
        <n-button
          quaternary
          :disabled="loading"
          @click="cancel"
        >
          Отмена
        </n-button>

        <n-button
          :type="confirmType"
          :loading="loading"
          @click="confirm"
        >
          <template
            v-if="confirmIcon"
            #icon
          >
            <icon :icon="confirmIcon" />
          </template>

          {{ confirmLabel }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
  .confirm-dialog {
    max-width: 480px;

    &__description {
      margin: 0;
      color: var(--text-color);
    }

    &__actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }
</style>
