<script lang="ts">
  import { httpClient } from '@/shared/api';
  import { useUserStore } from '@/shared/stores/UserStore';
  import { getApiErrorMessage } from '@/shared/utils/apiError';

  import ChangePasswordView from '@/features/account/ChangePasswordView.vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  interface ITokenValidation {
    correct: boolean;
    message: string;
  }

  export default defineComponent({
    components: {
      PageLayout,
      ChangePasswordView,
    },
    setup() {
      const route = useRoute();

      const userStore = useUserStore();
      const { isAuthenticated } = storeToRefs(userStore);

      const tokenValidation = ref<ITokenValidation>({
        correct: true,
        message: '',
      });

      const checkToken = async () => {
        if (isAuthenticated.value || !route.query.token) {
          return Promise.resolve();
        }

        try {
          // auth-service отвечает 204 без тела, если токен валиден,
          // и 400 с полем message — если нет.
          await httpClient.get({
            url: '/account/password/reset-token/validate',
            payload: {
              token: route.query.token,
            },
            version: 'auth',
          });

          tokenValidation.value = {
            correct: true,
            message: '',
          };

          return Promise.resolve();
        } catch (err) {
          tokenValidation.value = {
            correct: false,
            message: getApiErrorMessage(
              err,
              'Не удалось проверить ссылку для сброса пароля',
            ),
          };

          return Promise.resolve();
        }
      };

      onBeforeMount(async () => {
        await checkToken();
      });

      return {
        token: computed(() => (route.query.token as string) || ''),
        tokenValidation,
      };
    },
  });
</script>

<template>
  <page-layout>
    <template #title> Сброс пароля </template>

    <template
      v-if="!tokenValidation.correct"
      #subtitle
    >
      {{ tokenValidation.message }}
    </template>

    <template #default>
      <change-password-view
        :token="token"
        :token-validate="tokenValidation"
      />
    </template>
  </page-layout>
</template>
