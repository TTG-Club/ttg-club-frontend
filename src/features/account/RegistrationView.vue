<script lang="ts" setup>
  import { omit } from 'lodash-es';
  import { useToast } from 'vue-toastification';

  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import { useMetrics } from '@/shared/composable/useMetrics';
  import { ToastEventBus } from '@/shared/config';
  import { ALLOWED_SPECIAL_CHARACTERS } from '@/shared/const';
  import { useUserStore } from '@/shared/stores/UserStore';
  import {
    rulePassword,
    rulePasswordRepeat,
    ruleUsername,
    ruleEmail,
  } from '@/shared/utils/validation-rules/authChecks';

  import type { FormInst, FormRules } from 'naive-ui';

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'switch:auth'): void;
  }>();

  const userStore = useUserStore();
  const toast = useToast(ToastEventBus);
  const { sendSignUpMetrics, sendLoginMetrics } = useMetrics();
  const success = ref(false);
  const inProgress = ref(false);
  const formRef = ref<FormInst>();
  const vertical = useAppBreakpoints().smaller('sm');

  const model = reactive({
    username: '',
    email: '',
    password: '',
    repeat: '',
  });

  const rules = computed<FormRules>(() => ({
    username: ruleUsername({ minLength: 5, checkExist: true }),
    email: ruleEmail({ checkExist: true }),
    password: rulePassword({ minLength: 8 }),
    repeat: rulePasswordRepeat(model.password),
  }));

  const successHandler = () => {
    success.value = true;

    toast.success('Вы успешно зарегистрировались!');
    emit('close');
  };

  const validate = () => formRef.value!.validate();

  const onSubmit = async () => {
    inProgress.value = true;

    try {
      await validate();
    } catch (err) {
      toast.error('Проверьте правильность заполнения полей');

      inProgress.value = false;

      return;
    }

    try {
      await userStore.registration(omit(model, 'repeat'));

      sendSignUpMetrics();

      await userStore.authorization({
        usernameOrEmail: model.username,
        password: model.password,
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
      path="username"
    >
      <n-input
        v-model:value.trim="model.username"
        autocapitalize="off"
        autocomplete="username"
        autocorrect="off"
        placeholder="Имя пользователя"
      />
    </n-form-item>

    <n-form-item
      size="large"
      path="email"
    >
      <n-input
        v-model:value.trim="model.email"
        autocapitalize="off"
        autocomplete="email"
        autocorrect="off"
        placeholder="Электронный адрес"
      />
    </n-form-item>

    <n-form-item
      size="large"
      path="password"
    >
      <n-tooltip
        trigger="focus"
        class="mobile-show"
      >
        <template #trigger>
          <n-input
            v-model:value.trim="model.password"
            autocapitalize="off"
            autocomplete="new-password"
            autocorrect="off"
            type="password"
            placeholder="Пароль"
            show-password-on="click"
          />
        </template>

        <template #default>
          Допустимые спец. символы: {{ ALLOWED_SPECIAL_CHARACTERS.join(' ') }}
        </template>
      </n-tooltip>
    </n-form-item>

    <n-form-item
      size="large"
      path="repeat"
    >
      <n-input
        v-model:value.trim="model.repeat"
        autocapitalize="off"
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Повторите пароль"
        show-password-on="click"
      />
    </n-form-item>

    <n-flex
      :wrap="false"
      :vertical
    >
      <n-button
        :disabled="success"
        :loading="inProgress"
        type="primary"
        size="large"
        @click.left.exact.prevent="onSubmit"
      >
        Регистрация
      </n-button>

      <n-button
        quaternary
        size="large"
        @click.left.exact.prevent="$emit('switch:auth')"
      >
        Уже есть аккаунт
      </n-button>
    </n-flex>
  </n-form>
</template>
