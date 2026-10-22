<script setup lang="ts">
  import {
    activateSubscription,
    formatSubscriptionDate,
    getApiErrorMessage,
    getMySubscriptions,
    getSubscriptionCaption,
    getSubscriptionSummary,
    SUBSCRIPTION_ICON,
    SUBSCRIPTION_TEXT,
    SUBSCRIPTIONS_DATA_KEY,
  } from '../model';
  import { SubscriptionRedeem } from './ui';

  /**
   * Подписка: действующая или последняя истёкшая, запуск полученной по
   * промокоду и ввод нового промокода.
   */
  const toast = useToast();

  const isActivating = ref(false);

  const { data, status, refresh } = useAsyncData(
    SUBSCRIPTIONS_DATA_KEY,
    getMySubscriptions,
    { server: false, default: () => [] },
  );

  const summary = computed(() => getSubscriptionSummary(data.value));

  const isLoading = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const isFailed = computed(() => status.value === 'error');

  const activeUntil = computed(() =>
    formatSubscriptionDate(summary.value.active?.expiresAt),
  );

  const activeCaption = computed(() => {
    const { active } = summary.value;

    return active
      ? getSubscriptionCaption(active, SUBSCRIPTION_TEXT.months)
      : '';
  });

  const expiredAt = computed(() =>
    formatSubscriptionDate(summary.value.expired?.expiresAt),
  );

  const registeredCaption = computed(() => {
    const { registered } = summary.value;

    return registered
      ? getSubscriptionCaption(registered, SUBSCRIPTION_TEXT.months)
      : '';
  });

  /** Запускает срок подписки, полученной по промокоду. */
  async function activate(): Promise<void> {
    const { registered } = summary.value;

    if (!registered) {
      return;
    }

    isActivating.value = true;

    try {
      await activateSubscription(registered.id);
      await refresh();

      toast.add({
        title: SUBSCRIPTION_TEXT.activated,
        color: 'success',
        icon: SUBSCRIPTION_ICON.active,
      });
    } catch (error) {
      toast.add({
        title: SUBSCRIPTION_TEXT.activateFailed,
        description: getApiErrorMessage(error, ''),
        color: 'error',
        icon: SUBSCRIPTION_ICON.expired,
      });
    } finally {
      isActivating.value = false;
    }
  }

  async function reload(): Promise<void> {
    await refresh();
  }
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          :name="SUBSCRIPTION_ICON.title"
          class="size-5 text-warning"
        />

        {{ SUBSCRIPTION_TEXT.title }}
      </h2>
    </template>

    <div class="flex flex-col gap-4">
      <USkeleton
        v-if="isLoading"
        class="h-10 w-full"
      />

      <div
        v-else-if="isFailed"
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <p class="flex items-center gap-2 text-sm text-error">
          <UIcon
            :name="SUBSCRIPTION_ICON.expired"
            class="size-5 shrink-0"
          />

          {{ SUBSCRIPTION_TEXT.loadFailed }}
        </p>

        <UButton
          :label="SUBSCRIPTION_TEXT.retry"
          color="neutral"
          variant="subtle"
          size="sm"
          @click.left.exact.prevent="reload"
        />
      </div>

      <template v-else>
        <div
          v-if="summary.active"
          class="flex items-start gap-3"
        >
          <UIcon
            :name="SUBSCRIPTION_ICON.active"
            class="mt-0.5 size-5 shrink-0 text-success"
          />

          <div class="text-sm">
            <p class="font-medium text-highlighted">
              {{ SUBSCRIPTION_TEXT.active }}
            </p>

            <p
              v-if="activeCaption"
              class="text-muted"
            >
              {{ activeCaption }}
            </p>

            <p
              v-if="activeUntil"
              class="text-muted"
            >
              {{ SUBSCRIPTION_TEXT.activeUntil }} {{ activeUntil }}
            </p>
          </div>
        </div>

        <div
          v-else-if="summary.expired"
          class="flex items-start gap-3"
        >
          <UIcon
            :name="SUBSCRIPTION_ICON.expired"
            class="mt-0.5 size-5 shrink-0 text-error"
          />

          <div class="text-sm">
            <p class="font-medium text-highlighted">
              {{ SUBSCRIPTION_TEXT.expired }}
            </p>

            <p
              v-if="expiredAt"
              class="text-muted"
            >
              {{ SUBSCRIPTION_TEXT.expiredAt }} {{ expiredAt }}
            </p>
          </div>
        </div>

        <div
          v-else-if="!summary.registered"
          class="flex items-start gap-3"
        >
          <UIcon
            :name="SUBSCRIPTION_ICON.none"
            class="mt-0.5 size-5 shrink-0 text-muted"
          />

          <p class="text-sm text-muted">
            {{ SUBSCRIPTION_TEXT.none }}
          </p>
        </div>

        <div
          v-if="summary.registered"
          class="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-start gap-3">
            <UIcon
              :name="SUBSCRIPTION_ICON.registered"
              class="mt-0.5 size-5 shrink-0 text-warning"
            />

            <div class="text-sm">
              <p class="font-medium text-highlighted">
                {{ SUBSCRIPTION_TEXT.registered }}
              </p>

              <p
                v-if="registeredCaption"
                class="text-muted"
              >
                {{ registeredCaption }}
              </p>
            </div>
          </div>

          <UButton
            :label="SUBSCRIPTION_TEXT.activate"
            :icon="SUBSCRIPTION_ICON.activate"
            :loading="isActivating"
            size="sm"
            class="shrink-0 self-start sm:self-auto"
            @click.left.exact.prevent="activate"
          />
        </div>
      </template>

      <USeparator />

      <SubscriptionRedeem @redeemed="reload" />
    </div>
  </UCard>
</template>
