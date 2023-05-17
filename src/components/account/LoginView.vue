<template>
  <form
    class="login form"
    @keyup.enter.exact.prevent="onSubmit"
    @submit.prevent="onSubmit"
  >
    <div class="form__row">
      <ui-input
        v-model.trim="v$.usernameOrEmail.$model"
        :error-text="v$.usernameOrEmail.$dirty ? v$.usernameOrEmail.$errors?.[0]?.$message : ''"
        autocapitalize="off"
        autocomplete="username"
        autocorrect="off"
        placeholder="Логин или электронная почта"
        required
        @blur="v$.usernameOrEmail.$touch()"
        @input="v$.usernameOrEmail.$reset()"
      />
    </div>

    <div class="form__row">
      <ui-input
        v-model.trim="v$.password.$model"
        :error-text="v$.password.$dirty ? v$.password.$errors?.[0]?.$message : ''"
        autocapitalize="off"
        autocomplete="current-password"
        autocorrect="off"
        type="password"
        placeholder="Пароль"
        required
        @blur="v$.password.$touch()"
        @input="v$.password.$reset()"
      />
    </div>

    <div class="form__row">
      <ui-checkbox
        v-model="remember"
        type="toggle"
      >
        Запомнить меня
      </ui-checkbox>
    </div>

    <div class="form__row">
      <ui-button
        :disabled="success || inProgress"
        @click.left.exact.prevent="onSubmit"
      >
        Вход
      </ui-button>

      <ui-button
        type-link
        @click.left.exact.prevent="$emit('switch:reg')"
      >
        Регистрация
      </ui-button>

      <ui-button
        type-link
        @click.left.exact.prevent="$emit('switch:change-password')"
      >
        Забыли пароль?
      </ui-button>
    </div>
  </form>
</template>

<script lang="ts">
  import useVuelidate from '@vuelidate/core';
  import { helpers, or } from '@vuelidate/validators';
  import {
    defineComponent, reactive, ref
  } from 'vue';
  import { useToast } from 'vue-toastification';
  import UiInput from '@/components/UI/kit/UiInput.vue';
  import UiCheckbox from '@/components/UI/kit/UiCheckbox.vue';
  import UiButton from '@/components/UI/kit/UiButton.vue';
  import { useUserStore } from '@/store/UI/UserStore';
  import {
    validateEmailFormat,
    validatePwdSpecial,
    validateRequired,
    validateUsernameSpecialChars
  } from '@/common/helpers/authChecks';
  import { ToastEventBus } from '@/common/utils/ToastConfig';

  export default defineComponent({
    components: {
      UiButton,
      UiCheckbox,
      UiInput
    },
    setup(props, { emit }) {
      const userStore = useUserStore();
      const toast = useToast(ToastEventBus);
      const usernameOrEmail = ref('');
      const password = ref('');
      const remember = ref(true);
      const success = ref(false);
      const inProgress = ref(false);

      const rules = reactive({
        usernameOrEmail: {
          required: validateRequired(),
          format: helpers.withMessage(
            'Поле заполнено неверно',
            or(
              validateUsernameSpecialChars(),
              validateEmailFormat()
            )
          )
        },
        password: {
          required: validateRequired(),
          format: validatePwdSpecial()
        }
      });

      const v$ = useVuelidate(rules, {
        usernameOrEmail,
        password,
        remember
      });

      const successHandler = () => {
        success.value = true;

        toast.success('Вы успешно авторизовались!');
        emit('close');
      };

      const onSubmit = async () => {
        inProgress.value = true;

        await v$.value.$reset();

        const result = await v$.value.$validate();

        if (success.value || !result) {
          toast.error('Проверьте правильность заполнения полей');

          inProgress.value = false;

          return;
        }

        try {
          await userStore.authorization({
            usernameOrEmail: usernameOrEmail.value.trim(),
            password: password.value.trim(),
            remember: remember.value
          });

          successHandler();
        } catch (err: any) {
          if (!err?.response?.status) {
            toast.error('Неизвестная ошибка');

            return;
          }

          switch (err.response.status) {
            case 401:
              toast.error('Неверный логин или пароль');

              break;
            default:
              toast.error('Неизвестная ошибка');

              break;
          }
        } finally {
          inProgress.value = false;
        }
      };

      return {
        v$,
        usernameOrEmail,
        password,
        remember,
        success,
        inProgress,
        onSubmit
      };
    }
  });
</script>
