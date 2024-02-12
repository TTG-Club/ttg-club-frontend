<script lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, defineComponent, onBeforeMount, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { httpClient } from '@/shared/api';
  import { useUserStore } from '@/shared/stores/UserStore';

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
          const resp = await httpClient.get<ITokenValidation>({
            url: `/auth/token/validate?token=${route.query.token}`,
          });

          if (resp.status !== 200) {
            tokenValidation.value = {
              correct: false,
              message: 'Неизвестная ошибка',
            };

            return Promise.resolve();
          }

          tokenValidation.value = resp.data;

          return Promise.resolve();
        } catch (err) {
          tokenValidation.value = {
            correct: false,
            message: 'Неизвестная ошибка',
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
