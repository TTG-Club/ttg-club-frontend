<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import {
    COMMENTS_LOGIN_NOTE_BUTTON_LABEL,
    COMMENTS_LOGIN_NOTE_TEXT,
  } from '../model';

  const emit = defineEmits<{
    login: [];
  }>();

  function login(): void {
    emit('login');
  }
</script>

<template>
  <!--
    Одна строка: иконка, текст и вход. Блок стоит на месте формы отправки,
    поэтому по высоте держится ближе к ней, чем к карточке-баннеру. На узком
    экране кнопка переносится вниз — текст ужимать до многоточия нельзя.
  -->
  <div class="comments-login-note">
    <icon
      class="comments-login-note__icon"
      icon="tabler:message-circle"
    />

    <p class="comments-login-note__text">
      {{ COMMENTS_LOGIN_NOTE_TEXT }}
    </p>

    <n-button
      size="small"
      type="primary"
      @click.left.exact.prevent="login"
    >
      <template #icon>
        <icon icon="tabler:user" />
      </template>

      {{ COMMENTS_LOGIN_NOTE_BUTTON_LABEL }}
    </n-button>
  </div>
</template>

<style lang="scss" scoped>
  .comments-login-note {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;

    padding: 8px 12px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    &__icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--text-g-color);
    }

    &__text {
      flex: 1 1 auto;
      margin: 0;
      font-size: var(--main-font-size);
      color: var(--text-g-color);
    }
  }
</style>
