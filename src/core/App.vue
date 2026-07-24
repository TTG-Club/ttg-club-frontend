<script setup lang="ts">
  import { dateRuRU, ruRU } from 'naive-ui';

  import { configurateDayjs, themeOverrides } from '@/shared/config';
  import { BREAKPOINTS } from '@/shared/const/breakpoints';
  import { useUserStore } from '@/shared/stores/UserStore';

  import { BugReportModal, SelectionReportButton } from '@/features/bug-report';
  import { DiceHistory } from '@/features/dice-history/ui';
  import { useDiceNotification } from '@/features/dice-notification';
  import NavBar from '@/features/menu/NavBar.vue';
  import { useOnlineAdventurersHeartbeat } from '@/features/online-counter/useOnlineAdventurersCounter';

  configurateDayjs();

  const userStore = useUserStore();

  tryOnBeforeMount(async () => {
    await userStore.restoreSession();
  });

  useDiceNotification().enable();
  useOnlineAdventurersHeartbeat();
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

              <selection-report-button />

              <bug-report-modal />
            </n-dialog-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
