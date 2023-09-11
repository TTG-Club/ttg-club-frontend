<template>
  <nav-bar />

  <div
    id="container"
    class="container"
  >
    <router-view />
  </div>

  <modals-container />
</template>

<script setup lang="ts">
  import { tryOnBeforeMount } from '@vueuse/core';
  import { ModalsContainer } from 'vue-final-modal';

  import NavBar from '@/features/menu/NavBar.vue';

  import { useUIStore } from '@/shared/stores/UIStore';
  import { useUserStore } from '@/shared/stores/UserStore';

  const uiStore = useUIStore();
  const userStore = useUserStore();

  const initUser = async () => {
    try {
      if (await userStore.getUserStatus()) {
        await userStore.getUserInfo();
      }
    } catch (err) {
      await userStore.clearUser();
    }
  };

  const initTheme = async () => {
    await uiStore.removeOldTheme();

    const html = document.querySelector('html');

    let avoidHtmlUpdate = false;

    if (html?.dataset?.theme) {
      avoidHtmlUpdate = ['theme-light', 'theme-dark'].includes(
        html?.dataset?.theme
      );
    }

    uiStore.setTheme({
      name: uiStore.getCookieTheme(),
      avoidHtmlUpdate
    });
  };

  const initFullscreen = async () => {
    await uiStore.restoreFullscreenState();
  };

  tryOnBeforeMount(async () => {
    await initTheme();
    await initUser();
    await initFullscreen();
  });
</script>
