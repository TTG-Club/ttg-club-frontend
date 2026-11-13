<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import { DmScreenCanvas } from '../canvas';
  import { useDmScreen } from '../composables';
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT } from '../model';

  /**
   * Ширма гостя: одна, в этом браузере. Пока ширма пуста, по центру —
   * приглашение войти: после входа ширмы живут в аккаунте, а эта
   * переносится туда. В шапке кнопки входа нет: кто захочет сохранить
   * ширму, войдёт сам.
   */
  const { cachedScreen } = useDmScreen();

  const isAuthOpen = ref(false);

  // Копия ширмы из аккаунта гостю не нужна: после выхода её не должен
  // увидеть тот, кто войдёт в этом браузере следующим
  onMounted(() => {
    cachedScreen.value = null;
  });

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
