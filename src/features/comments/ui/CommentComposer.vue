<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import { useCommentSubmitCooldown } from '../composables';
  import {
    COMMENT_COMPOSER_CANCEL_LABEL,
    COMMENT_COMPOSER_PLACEHOLDER,
    COMMENT_COMPOSER_SUBMIT_LABEL,
    COMMENT_CONTENT_MAX_LENGTH,
    COMMENT_COOLDOWN_SECONDS_UNIT,
  } from '../model';

  import type { InputInst } from 'naive-ui';

  const {
    submitAction,
    initialContent = '',
    placeholder = COMMENT_COMPOSER_PLACEHOLDER,
    submitLabel = COMMENT_COMPOSER_SUBMIT_LABEL,
    cancellable = false,
    autofocus = false,
    withCooldown = true,
  } = defineProps<{
    /** Асинхронная отправка текста; true — успех, форма очищается. */
    submitAction: (content: string) => Promise<boolean>;
    initialContent?: string;
    placeholder?: string;
    submitLabel?: string;
    /** Показывать ли кнопку «Отмена» (формы ответа и правки). */
    cancellable?: boolean;
    autofocus?: boolean;
    /**
     * Подчиняется ли форма антиспам-паузе между отправками. Отключается
     * у формы правки: лимит сервиса действует только на создание.
     */
    withCooldown?: boolean;
  }>();

  const emit = defineEmits<{
    /** Текст успешно отправлен — родитель может закрыть форму. */
    done: [];
    cancel: [];
  }>();

  const content = ref(initialContent);
  const isPending = ref(false);
  const input = ref<InputInst | null>(null);

  const normalizedContent = computed(() => content.value.trim());

  const isTooLong = computed(
    () => normalizedContent.value.length > COMMENT_CONTENT_MAX_LENGTH,
  );

  const { remainingSeconds, isCoolingDown } = useCommentSubmitCooldown();

  /** Действует ли на форму антиспам-пауза прямо сейчас. */
  const isCooldownActive = computed(() => withCooldown && isCoolingDown.value);

  const canSubmit = computed(
    () =>
      !!normalizedContent.value &&
      !isTooLong.value &&
      !isPending.value &&
      !isCooldownActive.value,
  );

  /** Во время паузы кнопка показывает отсчёт до следующей отправки. */
  const submitButtonLabel = computed(() =>
    isCooldownActive.value
      ? `${submitLabel} · ${remainingSeconds.value} ${COMMENT_COOLDOWN_SECONDS_UNIT}`
      : submitLabel,
  );

  const lengthLabel = computed(
    () => `${normalizedContent.value.length} / ${COMMENT_CONTENT_MAX_LENGTH}`,
  );

  async function submit(): Promise<void> {
    if (!canSubmit.value) {
      return;
    }

    isPending.value = true;

    try {
      const success = await submitAction(normalizedContent.value);

      if (success) {
        content.value = '';

        emit('done');
      }
    } finally {
      isPending.value = false;
    }
  }

  function cancel(): void {
    emit('cancel');
  }

  /**
   * Enter отправляет сообщение, Shift+Enter — перенос строки.
   * Во время набора через IME Enter подтверждает ввод, а не отправляет.
   *
   * @param keyboardEvent Событие клавиатуры из поля ввода.
   */
  function handleKeydown(keyboardEvent: KeyboardEvent): void {
    if (
      keyboardEvent.key !== 'Enter' ||
      keyboardEvent.shiftKey ||
      keyboardEvent.isComposing
    ) {
      return;
    }

    keyboardEvent.preventDefault();

    submit();
  }

  function handleSubmitClick(): void {
    submit();
  }

  onMounted(() => {
    if (autofocus) {
      input.value?.focus();
    }
  });
</script>

<template>
  <div class="comment-composer">
    <n-input
      ref="input"
      v-model:value="content"
      type="textarea"
      :autosize="{ minRows: 2, maxRows: 8 }"
      :placeholder="placeholder"
      :disabled="isPending"
      @keydown="handleKeydown"
    />

    <div class="comment-composer__footer">
      <span
        class="comment-composer__length"
        :class="{ 'is-error': isTooLong }"
      >
        {{ lengthLabel }}
      </span>

      <div class="comment-composer__actions">
        <n-button
          v-if="cancellable"
          quaternary
          size="small"
          :disabled="isPending"
          @click.left.exact.prevent="cancel"
        >
          {{ COMMENT_COMPOSER_CANCEL_LABEL }}
        </n-button>

        <n-button
          type="primary"
          size="small"
          :loading="isPending"
          :disabled="!canSubmit"
          @click.left.exact.prevent="handleSubmitClick"
        >
          <template #icon>
            <icon icon="tabler:send-2" />
          </template>

          {{ submitButtonLabel }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .comment-composer {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &__footer {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }

    &__length {
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: var(--text-g-color);

      &.is-error {
        color: var(--error);
      }
    }

    &__actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }
</style>
