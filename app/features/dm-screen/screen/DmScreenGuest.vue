<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import { DmScreenCanvas } from '../canvas';
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT } from '../model';

  /**
   * Ширма гостя: одна, в этом браузере. Пока ширма пуста, по центру —
   * приглашение войти: после входа ширмы живут в аккаунте, а эта
   * переносится туда. В шапке кнопки входа нет: кто захочет сохранить
   * ширму, войдёт сам.
   */
  const isAuthOpen = ref(false);

  function openAuth(): void {
    isAuthOpen.value = true;
  }
</script>

<template>
  <DmScreenCanvas>
    <template #emptyNote>
      <p class="text-center text-sm text-muted">
        {{ DM_SCREEN_TEXT.guestDescription }}
      </p>

      <UButton
        :icon="DM_SCREEN_ICON.signIn"
        :label="DM_SCREEN_TEXT.signIn"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="openAuth"
      />
    </template>
  </DmScreenCanvas>

  <AuthModal v-model="isAuthOpen" />
</template>
