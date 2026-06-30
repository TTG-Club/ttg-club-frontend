<script setup lang="ts">
  import { storeToRefs } from 'pinia';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { getDateString } from '@/shared/utils/getDateString';

  import {
    SUBSCRIPTION_DATE_FORMAT,
    SUBSCRIPTION_STATUS_ACTIVE_PREFIX,
    SUBSCRIPTION_STATUS_INACTIVE,
  } from '@/features/subscription/model';
  import { useSubscriptionStore } from '@/features/subscription/store/SubscriptionStore';
  import RedeemCodeModal from '@/features/subscription/ui/RedeemCodeModal.vue';

  const subscriptionStore = useSubscriptionStore();
  const { isActive, expiresAt, isLoaded } = storeToRefs(subscriptionStore);

  const isRedeemOpen = ref(false);

  const expiresLabel = computed(() => {
    if (!isActive.value || !expiresAt.value) {
      return '';
    }

    const formatted = getDateString(expiresAt.value, SUBSCRIPTION_DATE_FORMAT);

    if (!formatted) {
      return '';
    }

    return `${SUBSCRIPTION_STATUS_ACTIVE_PREFIX} ${formatted}`;
  });

  const statusText = computed(() =>
    isActive.value
      ? expiresLabel.value || 'Подписка активна'
      : SUBSCRIPTION_STATUS_INACTIVE,
  );

  function openRedeem() {
    isRedeemOpen.value = true;
  }
</script>

<template>
  <div
    class="subscription-status"
    :class="{ 'is-active': isActive }"
  >
    <div class="subscription-status__info">
      <span class="subscription-status__icon">
        <svg-icon icon="star" />
      </span>

      <div class="subscription-status__text">
        <span class="subscription-status__title">Подписка</span>

        <span
          v-if="isLoaded"
          class="subscription-status__value"
        >
          {{ statusText }}
        </span>

        <span
          v-else
          class="subscription-status__value is-muted"
        >
          Загрузка статуса…
        </span>
      </div>
    </div>

    <n-button
      type="primary"
      secondary
      @click.left.exact.prevent="openRedeem"
    >
      Активировать промокод
    </n-button>

    <redeem-code-modal v-model="isRedeemOpen" />
  </div>
</template>

<style lang="scss" scoped>
  .subscription-status {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    padding: 16px 20px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    &.is-active {
      border-color: var(--primary);
    }

    &__info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    &__icon {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 40px;
      height: 40px;

      font-size: 24px;
      color: var(--text-color-title);

      background-color: var(--bg-main);
      border-radius: 8px;
    }

    &__text {
      display: flex;
      flex-direction: column;
    }

    &__title {
      font-size: var(--main-font-size);
      font-weight: 600;
      color: var(--text-color-title);
    }

    &__value {
      margin-top: 2px;

      &.is-muted {
        color: var(--text-color-mute);
      }
    }

    &.is-active &__value {
      color: var(--primary);
    }
  }
</style>
