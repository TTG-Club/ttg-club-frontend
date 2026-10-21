<script setup lang="ts">
  import axios from 'axios';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/shared/config';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import {
    SUBSCRIPTION_REDEEM_EMPTY,
    SUBSCRIPTION_REDEEM_ERROR,
    SUBSCRIPTION_REDEEM_INVALID,
    SUBSCRIPTION_REDEEM_LIMIT,
    SUBSCRIPTION_REDEEM_SUCCESS,
  } from '@/features/subscription/model';
  import { useSubscriptionStore } from '@/features/subscription/store/SubscriptionStore';

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
    }>(),
    {
      modelValue: false,
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'redeemed'): void;
  }>();

  const subscriptionStore = useSubscriptionStore();
  const toast = useToast(ToastEventBus);

  const isShow = useVModel(props, 'modelValue', emit);

  const code = ref('');
  const inProgress = ref(false);

  const close = () => {
    isShow.value = false;
  };

  const onAfterLeave = () => {
    code.value = '';
    inProgress.value = false;
  };

  const onSubmit = async () => {
    const trimmed = code.value.trim();

    if (!trimmed) {
      toast.error(SUBSCRIPTION_REDEEM_EMPTY);

      return;
    }

    inProgress.value = true;

    try {
      const result = await subscriptionStore.redeemCode(trimmed);

      if (result.success === false) {
        toast.error(result.message || SUBSCRIPTION_REDEEM_INVALID);

        return;
      }

      toast.success(result.message || SUBSCRIPTION_REDEEM_SUCCESS);

      emit('redeemed');
      close();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        switch (err.response?.status) {
          case 400:
          case 404:
          case 409:
            toast.error(SUBSCRIPTION_REDEEM_INVALID);

            break;
          case 429:
            toast.error(SUBSCRIPTION_REDEEM_LIMIT);

            break;
          default:
            toast.error(SUBSCRIPTION_REDEEM_ERROR);

            break;
        }

        return;
      }

      toast.error(SUBSCRIPTION_REDEEM_ERROR);
    } finally {
      inProgress.value = false;
    }
  };
</script>

<template>
  <n-modal
    v-model:show="isShow"
    :mask-closable="!inProgress"
    @after-leave="onAfterLeave"
  >
    <div class="redeem-modal">
      <div class="redeem-modal__header">
        <h4 class="redeem-modal__title">Активация промокода</h4>

        <n-button
          circle
          secondary
          :disabled="inProgress"
          @click.left.exact.prevent="close"
        >
          <template #icon>
            <svg-icon icon="close" />
          </template>
        </n-button>
      </div>

      <div class="redeem-modal__body">
        <p class="redeem-modal__hint">
          Введите промокод, чтобы активировать или продлить подписку.
        </p>

        <n-input
          v-model:value="code"
          placeholder="Промокод"
          size="large"
          autocapitalize="characters"
          autocomplete="off"
          autocorrect="off"
          :disabled="inProgress"
          autofocus
          @keyup.enter.exact.prevent.stop="onSubmit"
        />
      </div>

      <div class="redeem-modal__footer">
        <n-button
          secondary
          size="large"
          :disabled="inProgress"
          @click.left.exact.prevent="close"
        >
          Отмена
        </n-button>

        <n-button
          type="primary"
          size="large"
          :loading="inProgress"
          :disabled="!code.trim()"
          @click.left.exact.prevent="onSubmit"
        >
          Активировать
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
  .redeem-modal {
    display: flex;
    flex-direction: column;

    width: 95vw;
    max-width: 420px;

    color: var(--text-color);

    background-color: var(--bg-secondary);
    border-radius: 12px;
    box-shadow: var(--n-box-shadow);

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: 16px 24px;

      border-bottom: 1px solid var(--border);
    }

    &__title {
      margin: 0;
      color: var(--text-color-title);
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
    }

    &__hint {
      margin: 0;
      color: var(--text-color-mute);
    }

    &__footer {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: flex-end;

      padding: 16px 24px;

      background-color: var(--bg-main);
      border-top: 1px solid var(--border);
    }
  }
</style>
