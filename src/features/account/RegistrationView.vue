<script lang="ts" setup>
  import useVuelidate from '@vuelidate/core';
  import { helpers, sameAs } from '@vuelidate/validators';
  import { reactive, ref, unref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useMetrics } from '@/shared/composables/useMetrics';
  import { useUserStore } from '@/shared/stores/UserStore';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
  import {
    validateEmailExist,
    validateEmailFormat,
    validateMinLength,
    validatePwdLowerCase,
    validatePwdNumber,
    validatePwdSpecial,
    validatePwdUpperCase,
    validateRequired,
    validateUsernameExist,
    validateUsernameSpecialChars,
  } from '@/shared/utils/authChecks';

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'switch:auth'): void;
  }>();

  const userStore = useUserStore();
  const toast = useToast(ToastEventBus);
  const { sendSignUpMetrics, sendLoginMetrics } = useMetrics();
  const success = ref(false);
  const inProgress = ref(false);

  const state = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const rules = reactive({
    username: {
      required: validateRequired(),
      minLength: validateMinLength(5),
      specialChars: validateUsernameSpecialChars(),
      exist: validateUsernameExist(),
    },
    email: {
      required: validateRequired(),
      format: validateEmailFormat(),
      exist: validateEmailExist(),
    },
    password: {
      required: validateRequired(),
      minLength: validateMinLength(8),
      lowerCase: validatePwdLowerCase(),
      upperCase: validatePwdUpperCase(),
      numbers: validatePwdNumber(),
      specialChars: validatePwdSpecial(),
    },
    repeat: {
      required: validateRequired(),
      sameAs: helpers.withMessage(
        'Пароли не совпадают',
        sameAs(state.password),
      ),
    },
  });

  const v$ = useVuelidate(rules, state, { $lazy: true });

  const successHandler = () => {
    success.value = true;

    toast.success('Вы успешно зарегистрировались!');
    emit('close');
  };

  const onSubmit = async () => {
    inProgress.value = true;

    await v$.value.$reset();

    const result = await v$.value.$validate();

    if (!result) {
      toast.error('Проверьте правильность заполнения полей');

      inProgress.value = false;

      return;
    }

    try {
      await userStore.registration({
        username: state.username.trim(),
        email: state.email.trim(),
        password: state.password.trim(),
      });

      sendSignUpMetrics();

      await userStore.authorization({
        usernameOrEmail: state.username.trim(),
        password: state.password.trim(),
        remember: false,
      });

      sendLoginMetrics();
      successHandler();
    } catch (err) {
      toast.error('Неизвестная ошибка');
    } finally {
      inProgress.value = false;
    }
  };
</script>

<template>
  <form
    class="registration form"
    @submit.prevent="onSubmit"
    @keyup.enter.prevent.stop
  >
    <div class="form__row">
      <ui-input
        v-model.trim="v$.username.$model"
        :error-text="
          v$.username.$dirty ? unref(v$.username.$errors?.[0]?.$message) : ''
        "
        autocapitalize="off"
        autocomplete="username"
        autocorrect="off"
        placeholder="Имя пользователя"
        required
        @blur="v$.username.$touch()"
        @input="v$.username.$reset()"
      />
    </div>

    <div class="form__row">
      <ui-input
        v-model.trim="v$.email.$model"
        :error-text="
          v$.email.$dirty ? unref(v$.email.$errors?.[0]?.$message) : ''
        "
        autocapitalize="off"
        autocomplete="email"
        autocorrect="off"
        placeholder="Электронный адрес"
        required
        @blur="v$.email.$touch()"
        @input="v$.email.$reset()"
      />
    </div>

    <div class="form__row">
      <ui-input
        v-model.trim="v$.password.$model"
        :error-text="
          v$.password.$dirty ? unref(v$.password.$errors?.[0]?.$message) : ''
        "
        autocapitalize="off"
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Пароль"
        required
        @blur="v$.password.$touch()"
        @input="v$.password.$reset()"
      />
    </div>

    <div class="form__row">
      <ui-input
        v-model.trim="v$.repeat.$model"
        :error-text="
          v$.repeat.$dirty ? unref(v$.repeat.$errors?.[0]?.$message) : ''
        "
        autocapitalize="off"
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Повторите пароль"
        required
        @blur="v$.repeat.$touch()"
        @input="v$.repeat.$reset()"
      />
    </div>

    <div class="form__row">
      <ui-button
        :disabled="success"
        :loading="inProgress"
        native-type="submit"
        @click.left.exact.prevent="onSubmit"
      >
        Регистрация
      </ui-button>

      <ui-button
        type="secondary"
        @click.left.exact.prevent="$emit('switch:auth')"
      >
        Авторизация
      </ui-button>
    </div>
  </form>
</template>
