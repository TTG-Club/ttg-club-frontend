<template>
  <page-layout
    :show-separator="false"
    :use-social-links="false"
  >
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

<script lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, defineComponent, onBeforeMount, ref } from 'vue';
  import { useRoute } from 'vue-router';

  import { useAxios } from '@/shared/composition/useAxios';

  import ChangePasswordView from '@/components/account/ChangePasswordView.vue';
  import PageLayout from '@/components/content/PageLayout.vue';

  import { useUserStore } from '@/store/UI/UserStore';

  interface ITokenValidation {
    correct: boolean;
    message: string;
  }

  export default defineComponent({
    components: {
      PageLayout,
      ChangePasswordView
    },
    setup() {
      const route = useRoute();
      const http = useAxios();
      const userStore = useUserStore();
      const { isAuthenticated } = storeToRefs(userStore);

      const tokenValidation = ref<ITokenValidation>({
        correct: true,
        message: ''
      });

      const checkToken = async () => {
        if (isAuthenticated.value || !route.query.token) {
          return Promise.resolve();
        }

        try {
          const resp = await http.get<ITokenValidation>({
            url: `/auth/token/validate?token=${route.query.token}`
          });

          if (resp.status !== 200) {
            tokenValidation.value = {
              correct: false,
              message: 'Неизвестная ошибка'
            };

            return Promise.resolve();
          }

          tokenValidation.value = resp.data;

          return Promise.resolve();
        } catch (err) {
          tokenValidation.value = {
            correct: false,
            message: 'Неизвестная ошибка'
          };

          return Promise.resolve();
        }
      };

      onBeforeMount(async () => {
        await checkToken();
      });

      return {
        token: computed(() => (route.query.token as string) || ''),
        tokenValidation
      };
    }
  });
</script>

<style lang="scss" scoped></style>
