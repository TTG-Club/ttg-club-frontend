<script setup lang="ts">
  import { COMMENTS_ICON, COMMENTS_TEXT } from '../../model';

  /** Приглашение войти на месте формы отправки у гостя. */
  const emit = defineEmits<{
    login: [];
  }>();

  function login(): void {
    emit('login');
  }
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-default bg-elevated px-3 py-2"
  >
    <UIcon
      :name="COMMENTS_ICON.comments"
      class="size-5 shrink-0 text-muted"
    />

    <p class="flex-1 text-sm text-muted">
      {{ COMMENTS_TEXT.loginNote }}
    </p>

    <UButton
      size="sm"
      :icon="COMMENTS_ICON.login"
      :label="COMMENTS_TEXT.loginButton"
      @click.left.exact.prevent="login"
    />
  </div>
</template>
