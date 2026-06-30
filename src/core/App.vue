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
  import { useSubscriptionStore } from '@/features/subscription';

  configurateDayjs();

  const userStore = useUserStore();
  const subscriptionStore = useSubscriptionStore();

  const initUser = async () => {
    try {
      if (await userStore.getUserStatus()) {
        await userStore.getUserInfo();

        // Статус подписки берём реал-тайм из subscriber-service,
        // не полагаясь на роль из JWT (она устаревает до перелогина).
        await subscriptionStore.refreshStatus().catch(() => undefined);
        subscriptionStore.startPolling();
      }
    } catch (err) {
      await userStore.clearUser();
    }
  };

  tryOnBeforeMount(async () => {
    await initUser();
  });

  // Реал-тайм: обновляем статус при возвращении на вкладку.
  const visibility = useDocumentVisibility();

  watch(visibility, (state) => {
    if (state === 'visible' && userStore.isAuthenticated) {
      subscriptionStore.refreshStatus().catch(() => undefined);
    }
  });

  // Сбрасываем подписку и опрос при выходе / авторизации.
  watch(
    () => userStore.isAuthenticated,
    (authenticated) => {
      if (authenticated) {
        subscriptionStore.refreshStatus().catch(() => undefined);
        subscriptionStore.startPolling();

        return;
      }

      subscriptionStore.stopPolling();
      subscriptionStore.resetSubscription();
    },
  );

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
