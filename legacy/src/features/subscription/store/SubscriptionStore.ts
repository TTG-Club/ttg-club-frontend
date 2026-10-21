import { errorHandler } from '@/shared/utils/errorHandler';

import SubscriptionApi from '@/features/subscription/api';
import {
  EMPTY_SUBSCRIPTION,
  SUBSCRIPTION_POLL_INTERVAL_MS,
} from '@/features/subscription/model';
import type {
  RedeemCodeResult,
  Subscription,
} from '@/features/subscription/types/Subscription.d';

export const useSubscriptionStore = defineStore('SubscriptionStore', () => {
  const subscription = ref<Subscription>({ ...EMPTY_SUBSCRIPTION });
  const isLoading = ref(false);
  const isLoaded = ref(false);

  const isActive = computed(() => subscription.value.active);
  const expiresAt = computed(() => subscription.value.expiresAt);
  const startsAt = computed(() => subscription.value.startsAt);
  const type = computed(() => subscription.value.type);
  const isRegistered = computed(() => subscription.value.registered);

  let controller: AbortController | undefined;

  const resetSubscription = () => {
    subscription.value = { ...EMPTY_SUBSCRIPTION };
    isLoaded.value = false;
  };

  const refreshStatus = async () => {
    if (controller instanceof AbortController) {
      controller.abort();
    }

    controller = new AbortController();
    isLoading.value = true;

    try {
      subscription.value = await SubscriptionApi.getStatus(controller.signal);
      isLoaded.value = true;

      return subscription.value;
    } catch (err) {
      errorHandler(err);

      return Promise.reject(err);
    } finally {
      isLoading.value = false;
      controller = undefined;
    }
  };

  const redeemCode = async (code: string): Promise<RedeemCodeResult> => {
    const trimmed = code.trim();

    if (!trimmed) {
      return Promise.reject(new Error('EMPTY_CODE'));
    }

    const result = await SubscriptionApi.redeem(trimmed);

    // Если сервис вернул актуальный статус — применяем сразу,
    // иначе перечитываем статус, чтобы UI обновился в реал-тайме.
    if (result.subscription) {
      subscription.value = {
        ...subscription.value,
        ...result.subscription,
      };
      isLoaded.value = true;
    } else {
      await refreshStatus().catch(() => undefined);
    }

    return result;
  };

  // Реал-тайм: периодический опрос статуса.
  const { pause, resume } = useIntervalFn(
    () => {
      refreshStatus().catch(() => undefined);
    },
    SUBSCRIPTION_POLL_INTERVAL_MS,
    { immediate: false },
  );

  const startPolling = () => {
    resume();
  };

  const stopPolling = () => {
    pause();
  };

  return {
    subscription,
    isLoading,
    isLoaded,

    isActive,
    isRegistered,
    expiresAt,
    startsAt,
    type,

    refreshStatus,
    redeemCode,
    resetSubscription,
    startPolling,
    stopPolling,
  };
});
