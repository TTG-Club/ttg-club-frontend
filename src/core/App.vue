<script setup lang="ts">
  import { dateRuRU, ruRU } from 'naive-ui';

  import { configurateDayjs, themeOverrides } from '@/shared/config';
  import { BREAKPOINTS } from '@/shared/const/breakpoints';
  import { useUserStore } from '@/shared/stores/UserStore';

  import { DiceHistory } from '@/features/dice-history/ui';
  import { useDiceNotification } from '@/features/dice-notification';
  import NavBar from '@/features/menu/NavBar.vue';

  configurateDayjs();

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
  <n-config-provider
    :theme-overrides="themeOverrides"
    :locale="ruRU"
    :date-locale="dateRuRU"
    abstract
    inline-theme-disabled
    :breakpoints="BREAKPOINTS"
  >
    <n-global-style />

    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-dialog-provider>
              <nav-bar />

              <div
                id="container"
                class="container"
              >
                <router-view />
              </div>

              <dice-history />
            </n-dialog-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
