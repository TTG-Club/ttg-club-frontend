<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import { DmScreenCanvas } from '../canvas';
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT } from '../model';

  /**
   * Ширма гостя: одна, в этом браузере. В шапке — приглашение войти: после
   * входа ширмы живут в аккаунте, а эта переносится туда.
   */
  const isAuthOpen = ref(false);

  function openAuth(): void {
    isAuthOpen.value = true;
  }
</script>

<template>
  <DmScreenCanvas>
    <template #actions>
      <UTooltip :text="DM_SCREEN_TEXT.guestDescription">
        <UButton
          :icon="DM_SCREEN_ICON.signIn"
          :label="DM_SCREEN_TEXT.signIn"
          @click.left.exact.prevent="openAuth"
        />
      </UTooltip>
    </template>
  </DmScreenCanvas>

  <AuthModal v-model="isAuthOpen" />
</template>
