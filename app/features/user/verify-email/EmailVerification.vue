<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import {
    AUTH_ICON,
    AUTH_ROUTE,
    VERIFY_EMAIL_PAGE,
    verifyEmail,
  } from '../model';

  /**
   * Подтверждение почты по ссылке из письма. Ссылка одноразовая, поэтому
   * запрос уходит только из браузера, а не при отрисовке на сервере.
   */
  const { token = undefined } = defineProps<{
    token?: string;
  }>();

  const isAuthOpen = ref(false);

  const { status } = useAsyncData(
    () => `verify-email:${token}`,
    async () => {
      if (!token) {
        throw new Error(VERIFY_EMAIL_PAGE.noToken);
      }

      await verifyEmail(token);

      return true;
    },
    { server: false },
  );

  const isPending = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const isVerified = computed(() => status.value === 'success');

  const failedText = computed(() =>
    token ? VERIFY_EMAIL_PAGE.failed : VERIFY_EMAIL_PAGE.noToken,
  );

  function openAuth(): void {
    isAuthOpen.value = true;
  }
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-xl border border-default bg-elevated/50 p-8"
  >
    <div
      v-if="isPending"
      class="flex items-center justify-center gap-2 py-6 text-muted"
    >
      <UIcon
        :name="AUTH_ICON.pending"
        class="size-5 animate-spin"
      />

      {{ VERIFY_EMAIL_PAGE.pending }}
    </div>

    <UEmpty
      v-else-if="isVerified"
      :icon="AUTH_ICON.verified"
      :title="VERIFY_EMAIL_PAGE.title"
      :description="VERIFY_EMAIL_PAGE.success"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="VERIFY_EMAIL_PAGE.signIn"
          :icon="AUTH_ICON.user"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <UEmpty
      v-else
      :icon="AUTH_ICON.failed"
      :title="VERIFY_EMAIL_PAGE.title"
      :description="failedText"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="VERIFY_EMAIL_PAGE.home"
          :to="AUTH_ROUTE.home"
          color="neutral"
          variant="subtle"
        />
      </template>
    </UEmpty>

    <AuthModal v-model="isAuthOpen" />
  </div>
</template>
