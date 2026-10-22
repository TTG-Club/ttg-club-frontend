<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { RedeemCodeState, RedeemResult } from '../../model';

  import {
    getApiErrorMessage,
    getPerkLabels,
    getSubscriptionCaption,
    redeemCode,
    redeemCodeSchema,
    SUBSCRIPTION_ICON,
    SUBSCRIPTION_TEXT,
  } from '../../model';

  /** Ввод промокода и то, что он принёс. */
  const emit = defineEmits<{
    redeemed: [];
  }>();

  const toast = useToast();

  const isSubmitting = ref(false);

  const result = ref<RedeemResult>();

  const state = reactive<RedeemCodeState>({ code: '' });

  const perkLabels = computed(() =>
    getPerkLabels(result.value?.grantedPerks ?? []),
  );

  const subscriptionLabel = computed(() => {
    const subscription = result.value?.subscription;

    if (!subscription) {
      return '';
    }

    return [
      SUBSCRIPTION_TEXT.subscription,
      getSubscriptionCaption(subscription, SUBSCRIPTION_TEXT.months),
    ]
      .filter(Boolean)
      .join(' · ');
  });

  const achievementCount = computed(
    () => result.value?.grantedAchievements.length ?? 0,
  );

  const achievementLabel = computed(
    () => `${SUBSCRIPTION_TEXT.achievements}: ${achievementCount.value}`,
  );

  // Часть наград могла быть у пользователя раньше, тогда новых нет
  const hasGranted = computed(
    () =>
      !!result.value?.subscription
      || perkLabels.value.length > 0
      || achievementCount.value > 0,
  );

  const alertTitle = computed(() =>
    hasGranted.value ? SUBSCRIPTION_TEXT.granted : SUBSCRIPTION_TEXT.nothingNew,
  );

  const alertIcon = computed(() =>
    hasGranted.value ? SUBSCRIPTION_ICON.redeem : SUBSCRIPTION_ICON.info,
  );

  const alertColor = computed(() => (hasGranted.value ? 'success' : 'neutral'));

  /**
   * Гасит промокод.
   * @param event - проверенная форма
   */
  async function submit(
    event: FormSubmitEvent<RedeemCodeState>,
  ): Promise<void> {
    isSubmitting.value = true;

    try {
      result.value = await redeemCode(event.data.code);
      state.code = '';

      toast.add({
        title: SUBSCRIPTION_TEXT.redeemed,
        color: 'success',
        icon: SUBSCRIPTION_ICON.redeem,
      });

      emit('redeemed');
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SUBSCRIPTION_TEXT.redeemFailed),
        color: 'error',
        icon: SUBSCRIPTION_ICON.code,
      });
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <UForm
      :schema="redeemCodeSchema"
      :state="state"
      @submit="submit"
    >
      <UFormField
        :label="SUBSCRIPTION_TEXT.code"
        name="code"
      >
        <div class="flex items-start gap-2">
          <UInput
            v-model="state.code"
            :placeholder="SUBSCRIPTION_TEXT.codePlaceholder"
            :icon="SUBSCRIPTION_ICON.code"
            :ui="{ base: 'uppercase placeholder:normal-case' }"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            class="flex-1"
          />

          <UButton
            :label="SUBSCRIPTION_TEXT.redeem"
            :loading="isSubmitting"
            type="submit"
          />
        </div>
      </UFormField>
    </UForm>

    <UAlert
      v-if="result"
      :title="alertTitle"
      :icon="alertIcon"
      :color="alertColor"
      variant="subtle"
    >
      <template
        v-if="hasGranted"
        #description
      >
        <div class="mt-1 flex flex-wrap gap-1.5">
          <UBadge
            v-if="subscriptionLabel"
            :label="subscriptionLabel"
            color="warning"
            variant="subtle"
          />

          <UBadge
            v-for="label in perkLabels"
            :key="label"
            :label="label"
            color="success"
            variant="subtle"
          />

          <UBadge
            v-if="achievementCount"
            :label="achievementLabel"
            color="info"
            variant="subtle"
          />
        </div>
      </template>
    </UAlert>
  </div>
</template>
