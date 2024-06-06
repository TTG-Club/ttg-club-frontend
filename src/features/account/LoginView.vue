<script lang="ts" setup>
  import useVuelidate from '@vuelidate/core';
  import { helpers, or } from '@vuelidate/validators';
  import { reactive, ref, unref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useMetrics } from '@/shared/composables/useMetrics';
  import { useUserStore } from '@/shared/stores/UserStore';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
  import {
    validateEmailFormat,
    validatePwdSpecial,
    validateRequired,
    validateUsernameSpecialChars,
  } from '@/shared/utils/authChecks';

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'switch:reg'): void;
    (e: 'switch:change-password'): void;
  }>();

  const userStore = useUserStore();
  const { sendLoginMetrics } = useMetrics();
  const toast = useToast(ToastEventBus);
  const success = ref(false);
  const inProgress = ref(false);

  const rules = reactive({
    usernameOrEmail: {
      required: validateRequired(),
      format: helpers.withMessage(
        'Поле заполнено неверно',
        or(validateUsernameSpecialChars(), validateEmailFormat()),
      ),
    },
    password: {
      required: validateRequired(),
      format: validatePwdSpecial(),
    },
    remember: {},
  });

  const state = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const v$ = useVuelidate(rules, state, { $lazy: true });

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
        usernameOrEmail: state.usernameOrEmail.trim(),
        password: state.password.trim(),
        remember: state.remember,
      });

      sendLoginMetrics();
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
</script>

<template>
  <form
    class="login form"
    @submit.prevent="onSubmit"
    @keyup.enter.prevent.stop
  >
    <div class="form__row">
      <ui-input
        v-model.trim="v$.usernameOrEmail.$model"
        :error-text="
          v$.usernameOrEmail.$dirty
            ? unref(v$.usernameOrEmail.$errors?.[0]?.$message)
            : ''
        "
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
        :error-text="
          v$.password.$dirty ? unref(v$.password.$errors?.[0]?.$message) : ''
        "
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
        v-model="v$.remember.$model"
        type="toggle"
      >
        Запомнить меня
      </ui-checkbox>
    </div>

    <div class="form__row">
      <ui-button
        :disabled="success"
        :loading="inProgress"
        native-type="submit"
        @click.left.exact.prevent="onSubmit"
      >
        Вход
      </ui-button>

      <ui-button
        type="secondary"
        @click.left.exact.prevent="$emit('switch:reg')"
      >
        Регистрация
      </ui-button>

      <ui-button
        type="secondary"
        @click.left.exact.prevent="$emit('switch:change-password')"
      >
        Забыли пароль?
      </ui-button>
    </div>
  </form>
</template>
