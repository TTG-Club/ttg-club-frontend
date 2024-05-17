<script setup lang="ts">
  import { tryOnBeforeMount } from '@vueuse/core';
  import { ModalsContainer } from 'vue-final-modal';

  import { useUserStore } from '@/shared/stores/UserStore';

  import { DiceHistory } from '@/features/dice-history/ui';
  import { useDiceNotification } from '@/features/dice-notification';
  import NavBar from '@/features/menu/NavBar.vue';

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

  tryOnBeforeMount(async () => {
    await initUser();
  });

  useDiceNotification().enable();
</script>

<template>
  <nav-bar />

  <div
    id="container"
    class="container"
  >
    <router-view />
  </div>

  <dice-history />

  <modals-container />
</template>
