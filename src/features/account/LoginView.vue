<script lang="ts" setup>
  import { useToast } from 'vue-toastification';

  import { useMetrics } from '@/shared/composable/useMetrics';
  import { ToastEventBus } from '@/shared/config';
  import { useUserStore } from '@/shared/stores/UserStore';
  import {
    rulePassword,
    ruleUsernameOrEmail,
  } from '@/shared/utils/validation-rules/authChecks';

  import type { FormInst, FormRules } from 'naive-ui';

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
  const formRef = ref<FormInst>();

  const model = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const rules: FormRules = reactive({
    usernameOrEmail: ruleUsernameOrEmail(),
    password: rulePassword(),
  });

  const successHandler = () => {
    success.value = true;

    toast.success('Вы успешно авторизовались!');
    emit('close');
  };

  const validate = () => formRef.value!.validate();

  const onSubmit = async () => {
    if (success.value) {
      emit('close');

      return;
    }

    inProgress.value = true;

    try {
      await validate();
    } catch (err) {
      toast.error('Проверьте правильность заполнения полей');

      inProgress.value = false;

      return;
    }

    try {
      await userStore.authorization(model);

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
  <n-form
    ref="formRef"
    :rules
    :model
    label-placement="left"
    @submit.prevent.stop="onSubmit"
    @keyup.enter.exact.prevent.stop="onSubmit"
  >
    <n-form-item
      size="large"
      path="usernameOrEmail"
    >
      <n-input
        v-model:value.trim="model.usernameOrEmail"
        autocapitalize="off"
        autocomplete="username"
        autocorrect="off"
        placeholder="Логин или электронная почта"
        autofocus
      />
    </n-form-item>

    <n-form-item
      size="large"
      path="password"
    >
      <n-input
        v-model:value.trim="model.password"
        autocapitalize="off"
        autocomplete="current-password"
        autocorrect="off"
        type="password"
        placeholder="Пароль"
        show-password-on="click"
      />
    </n-form-item>

    <n-form-item>
      <n-checkbox v-model:checked="model.remember"> Запомнить меня </n-checkbox>
    </n-form-item>

    <n-flex :wrap="false">
      <n-button
        :disabled="success"
        :loading="inProgress"
        type="primary"
        size="large"
        @click.left.exact.prevent="onSubmit"
      >
        Вход
      </n-button>

      <n-button
        secondary
        size="large"
        @click.left.exact.prevent="$emit('switch:reg')"
      >
        Регистрация
      </n-button>

      <n-button
        quaternary
        size="large"
        @click.left.exact.prevent="$emit('switch:change-password')"
      >
        Забыли пароль?
      </n-button>
    </n-flex>
  </n-form>
</template>
