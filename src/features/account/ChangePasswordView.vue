<script lang="ts" setup>
  import { useToast } from 'vue-toastification';

  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import { ToastEventBus } from '@/shared/config';
  import { ALLOWED_SPECIAL_CHARACTERS } from '@/shared/const';
  import { useUserStore } from '@/shared/stores/UserStore';
  import {
    ruleEmail,
    rulePassword,
    rulePasswordRepeat,
  } from '@/shared/utils/validation-rules/authChecks';

  import type { FormInst, FormRules } from 'naive-ui';

  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'switch:auth'): void;
  }>();

  const props = withDefaults(
    defineProps<{
      token?: string;
      tokenValidate?: {
        correct: boolean;
        message: string;
      };
    }>(),
    {
      token: '',
      tokenValidate: () => ({
        correct: true,
        message: '',
      }),
    },
  );

  const router = useRouter();
  const toast = useToast(ToastEventBus);
  const userStore = useUserStore();
  const { isAuthenticated } = storeToRefs(userStore);
  const success = ref(false);
  const inProgress = ref(false);
  const formRef = ref<FormInst>();
  const vertical = useAppBreakpoints().smaller('sm');

  const model = reactive({
    email: '',
    password: '',
    repeat: '',
  });

  const isOnlyPassword = computed(() => props.token || isAuthenticated.value);

  const noSideSpace = (value: string) => !/ /g.test(value);

  const rules = computed<FormRules>(() => {
    if (isOnlyPassword.value) {
      return reactive({
        password: rulePassword({ minLength: 8 }),
        repeat: rulePasswordRepeat(model.password),
      });
    }

    return reactive({
      email: ruleEmail(),
    });
  });

  const validate = () => formRef.value!.validate();

  async function sendQuery() {
    if (isOnlyPassword.value) {
      try {
        const payload = {
          password: model.password,
          [isAuthenticated.value ? 'userToken' : 'resetToken']:
            isAuthenticated.value ? userStore.getUserToken() : props.token,
        };

        await userStore.changePassword(payload);

        toast.success('Пароль успешно изменен!', {
          onClose: () => {
            if (!props.token) {
              return;
            }

            router.replace({ name: 'index' });
          },
        });

        emit('close');

        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }

    try {
      await userStore.resetPassword(model.email);

      toast.success(
        'Ссылка для изменения пароля отправлена на указанный e-mail',
      );

      emit('close');

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async function onSubmit() {
    if (!props.tokenValidate?.correct) {
      toast.error(props.tokenValidate.message);

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
      await sendQuery();

      success.value = true;
    } catch (err) {
      toast.error('Неизвестная ошибка');
    } finally {
      inProgress.value = false;
    }
  }
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
      v-if="!isOnlyPassword"
      path="email"
    >
      <n-input
        v-model:value="model.email"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        placeholder="Электронный адрес"
        autofocus
        size="large"
        :allow-input="noSideSpace"
      />
    </n-form-item>

    <n-form-item
      v-if="isOnlyPassword"
      path="password"
    >
      <n-tooltip
        trigger="focus"
        class="mobile-show"
      >
        <template #trigger>
          <n-input
            v-model:value="model.password"
            autocapitalize="off"
            autocomplete="new-password"
            autocorrect="off"
            type="password"
            placeholder="Новый пароль"
            show-password-on="click"
            autofocus
            size="large"
            :allow-input="noSideSpace"
          />
        </template>

        <template #default>
          Допустимые спец. символы: {{ ALLOWED_SPECIAL_CHARACTERS.join(' ') }}
        </template>
      </n-tooltip>
    </n-form-item>

    <n-form-item
      v-if="isOnlyPassword"
      path="repeat"
    >
      <n-input
        v-model:value="model.repeat"
        autocapitalize="off"
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Повторите пароль"
        show-password-on="click"
        size="large"
        :allow-input="noSideSpace"
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
        {{ isOnlyPassword ? 'Изменить пароль' : 'Восстановить пароль' }}
      </n-button>

      <n-button
        v-if="!isAuthenticated"
        quaternary
        size="large"
        @click.left.exact.prevent="$emit('switch:auth')"
      >
        Авторизация
      </n-button>
    </n-flex>
  </n-form>
</template>
