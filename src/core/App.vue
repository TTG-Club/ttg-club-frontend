<script setup lang="ts">
  import { ModalsContainer } from 'vue-final-modal';

  import { useUserStore } from '@/shared/stores/UserStore';

  import { DiceHistory } from '@/features/dice-history/ui';
  import { useDiceNotification } from '@/features/dice-notification';
  import NavBar from '@/features/menu/NavBar.vue';

  import './config/dayjs';
  import { themeOverrides } from './config';

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
  >
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

              <modals-container />
            </n-dialog-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
