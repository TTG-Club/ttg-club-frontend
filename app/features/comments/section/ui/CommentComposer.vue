<script setup lang="ts">
  import { useCommentSubmitCooldown } from '../../composables';
  import {
    COMMENT_CONTENT_MAX_LENGTH,
    COMMENTS_ICON,
    COMMENTS_TEXT,
  } from '../../model';

  /** Форма комментария: новый, ответ или правка. */
  const {
    submitAction,
    initialContent = '',
    placeholder = COMMENTS_TEXT.composerPlaceholder,
    submitLabel = COMMENTS_TEXT.submit,
    cancellable = false,
    autofocus = false,
    withCooldown = true,
  } = defineProps<{
    /** Отправка текста; `true` — успех, форма очищается. */
    submitAction: (content: string) => Promise<boolean>;
    initialContent?: string;
    placeholder?: string;
    submitLabel?: string;
    /** Кнопка «Отмена» для форм ответа и правки. */
    cancellable?: boolean;
    autofocus?: boolean;
    /** Подчиняется ли форма паузе между отправками; у правки её нет. */
    withCooldown?: boolean;
  }>();

  const emit = defineEmits<{
    done: [];
    cancel: [];
  }>();

  const content = ref(initialContent);
  const isPending = ref(false);

  const normalizedContent = computed(() => content.value.trim());

  const isTooLong = computed(
    () => normalizedContent.value.length > COMMENT_CONTENT_MAX_LENGTH,
  );

  const { remainingSeconds, isCoolingDown } = useCommentSubmitCooldown();

  const isCooldownActive = computed(() => withCooldown && isCoolingDown.value);

  const canSubmit = computed(
    () =>
      !!normalizedContent.value
      && !isTooLong.value
      && !isPending.value
      && !isCooldownActive.value,
  );

  /** Во время паузы кнопка показывает отсчёт. */
  const submitButtonLabel = computed(() =>
    isCooldownActive.value
      ? `${submitLabel} · ${remainingSeconds.value} ${COMMENTS_TEXT.cooldownUnit}`
      : submitLabel,
  );

  const lengthLabel = computed(
    () => `${normalizedContent.value.length} / ${COMMENT_CONTENT_MAX_LENGTH}`,
  );

  const lengthLabelClass = computed(() =>
    isTooLong.value ? 'text-error' : 'text-dimmed',
  );

  async function submit(): Promise<void> {
    if (!canSubmit.value) {
      return;
    }

    isPending.value = true;

    try {
      if (await submitAction(normalizedContent.value)) {
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
   * Enter отправляет, Shift+Enter переносит строку. Во время набора через
   * IME Enter подтверждает ввод.
   */
  function handleKeydown(keyboardEvent: KeyboardEvent): void {
    if (
      keyboardEvent.key !== 'Enter'
      || keyboardEvent.shiftKey
      || keyboardEvent.isComposing
    ) {
      return;
    }

    keyboardEvent.preventDefault();
    void submit();
  }

  function handleSubmitClick(): void {
    void submit();
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <UTextarea
      v-model="content"
      autoresize
      :rows="2"
      :maxrows="8"
      :placeholder="placeholder"
      :autofocus="autofocus"
      :disabled="isPending"
      @keydown="handleKeydown"
    />

    <div class="flex items-center justify-between gap-2">
      <span
        class="text-xs tabular-nums"
        :class="lengthLabelClass"
      >
        {{ lengthLabel }}
      </span>

      <div class="flex items-center gap-2">
        <UButton
          v-if="cancellable"
          variant="ghost"
          color="neutral"
          size="sm"
          :label="COMMENTS_TEXT.cancel"
          :disabled="isPending"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :icon="COMMENTS_ICON.send"
          size="sm"
          :label="submitButtonLabel"
          :loading="isPending"
          :disabled="!canSubmit"
          @click.left.exact.prevent="handleSubmitClick"
        />
      </div>
    </div>
  </div>
</template>
