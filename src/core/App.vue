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

  import { useUserStore } from '@/shared/stores/UserStore';

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
</script>
