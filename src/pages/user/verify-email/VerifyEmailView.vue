<script lang="ts">
  import { httpClient } from '@/shared/api';

  import PageLayout from '@/layouts/PageLayout.vue';

  type TVerifyEmailStatus = 'pending' | 'success' | 'error';

  export default defineComponent({
    components: {
      PageLayout,
    },
    setup() {
      const route = useRoute();

      const status = ref<TVerifyEmailStatus>('pending');
      const message = ref('Подтверждаем почту...');

      const verifyEmail = async () => {
        const { token } = route.query;

        if (!token || Array.isArray(token)) {
          status.value = 'error';
          message.value = 'Некорректная ссылка подтверждения почты';

          return;
        }

        try {
          await httpClient.get({
            url: '/auth/verify-email',
            payload: { token },
          });

          status.value = 'success';
          message.value = 'Почта успешно подтверждена';
        } catch (err) {
          status.value = 'error';
          message.value = 'Не удалось подтвердить почту';
        }
      };

      onBeforeMount(async () => {
        await verifyEmail();
      });

      return {
        status,
        message,
      };
    },
  });
</script>

<template>
  <page-layout>
    <template #title>Подтверждение почты</template>

    <template #subtitle>
      {{ message }}
    </template>

    <template #default>
      <div
        class="verify-email-view"
        :class="`verify-email-view--${status}`"
      >
        <div class="verify-email-view__status">
          {{ message }}
        </div>

        <router-link
          v-if="status !== 'pending'"
          class="verify-email-view__link"
          :to="{ name: 'index' }"
        >
          На главную
        </router-link>
      </div>
    </template>
  </page-layout>
</template>

<style lang="scss" scoped>
  .verify-email-view {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    &__status {
      font-size: 18px;
      line-height: 1.4;
    }

    &__link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 18px;
      border-radius: 4px;
      color: var(--primary);
      border: 1px solid currentColor;
      text-decoration: none;
      transition:
        color 0.2s ease,
        opacity 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
    }

    &--success &__status {
      color: var(--success);
    }

    &--error &__status {
      color: var(--error);
    }
  }
</style>
