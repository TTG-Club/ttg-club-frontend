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
        const token = route.query.token;

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
      <n-result
        :status="
          status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'
        "
        :title="message"
      >
        <template
          v-if="status !== 'pending'"
          #footer
        >
          <n-button
            type="primary"
            @click="$router.replace({ name: 'index' })"
          >
            На главную
          </n-button>
        </template>
      </n-result>
    </template>
  </page-layout>
</template>
