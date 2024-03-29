<script lang="ts">
  import useVuelidate from '@vuelidate/core';
  import { helpers, or, sameAs } from '@vuelidate/validators';
  import { storeToRefs } from 'pinia';
  import { computed, defineComponent, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useUserStore } from '@/shared/stores/UserStore';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
  import {
    validateEmailFormat,
    validateMinLength,
    validatePwdLowerCase,
    validatePwdNumber,
    validatePwdSpecial,
    validatePwdUpperCase,
    validateRequired,
    validateUsernameSpecialChars,
  } from '@/shared/utils/authChecks';

  import type { PropType } from 'vue';

  export default defineComponent({
    components: {
      UiButton,
      UiInput,
    },
    props: {
      token: {
        type: String,
        default: '',
      },
      tokenValidate: {
        type: Object as PropType<{
          correct: boolean;
          message: string;
        }>,
        default: () => ({
          correct: true,
          message: '',
        }),
      },
    },
    emits: ['close', 'switch:auth'],
    setup(props, { emit }) {
      const router = useRouter();
      const toast = useToast(ToastEventBus);
      const userStore = useUserStore();
      const { isAuthenticated } = storeToRefs(userStore);
      const success = ref(false);
      const inProgress = ref(false);
      const error = ref({});

      const state = reactive({
        email: '',
        password: '',
        repeat: '',
      });

      const isOnlyPassword = computed(
        () => props.token || isAuthenticated.value,
      );

      const validations = computed(() => {
        if (isOnlyPassword.value) {
          return {
            email: {
              format: or(validateUsernameSpecialChars(), validateEmailFormat()),
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
                sameAs(computed(() => state.password)),
              ),
            },
          };
        }

        return {
          email: {
            required: validateRequired(),
            format: validateEmailFormat(),
          },
        };
      });

      const v$ = useVuelidate(validations.value, state, { $lazy: true });

      async function sendQuery() {
        if (isOnlyPassword.value) {
          try {
            const payload = {
              password: state.password,
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
          await userStore.resetPassword(state.email);

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

        await v$.value.$reset();

        const result = await v$.value.$validate();

        if (!result) {
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

      return {
        isAuthenticated,
        inProgress,
        isOnlyPassword,
        v$,
        error,
        success,
        onSubmit,
      };
    },
  });
</script>

<template>
  <form
    class="change-password form"
    @submit.prevent="onSubmit"
    @keyup.enter.prevent.stop
  >
    <div
      :class="{ 'is-hidden': isOnlyPassword }"
      class="form__row"
    >
      <ui-input
        v-model.trim="v$.email.$model"
        :autocomplete="isOnlyPassword ? 'username' : 'email'"
        :error-text="v$.email.$dirty ? v$.email.$errors?.[0]?.$message : ''"
        autocapitalize="off"
        autocorrect="off"
        placeholder="Электронный адрес"
        required
        @blur="v$.email.$touch()"
        @input="v$.email.$reset()"
      />
    </div>

    <div
      v-if="isOnlyPassword"
      class="form__row"
    >
      <ui-input
        v-model.trim="v$.password.$model"
        :error-text="
          v$.password.$dirty ? v$.password.$errors?.[0]?.$message : ''
        "
        autocapitalize="off"
        autocomplete="new-password"
        autocorrect="off"
        type="password"
        placeholder="Новый пароль"
        required
        @blur="v$.password.$touch()"
        @input="v$.password.$reset()"
      />
    </div>

    <div
      v-if="isOnlyPassword"
      class="form__row"
    >
      <ui-input
        v-model.trim="v$.repeat.$model"
        :error-text="v$.repeat.$dirty ? v$.repeat.$errors?.[0]?.$message : ''"
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
        {{ isOnlyPassword ? 'Изменить пароль' : 'Восстановить пароль' }}
      </ui-button>

      <ui-button
        v-if="!isAuthenticated"
        type="secondary"
        @click.left.exact.prevent="$emit('switch:auth')"
      >
        Авторизация
      </ui-button>
    </div>
  </form>
</template>
