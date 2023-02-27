<template>
    <page-layout>
        <template #title>
            Сброс пароля
        </template>

        <template
            v-if="!tokenValidation.correct"
            #subtitle
        >
            {{ tokenValidation.message }}
        </template>

        <template #default>
            <form
                class="change-password form"
                @keyup.enter.exact.prevent="onSubmit"
                @submit.prevent="onSubmit"
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
                        :error-text="v$.password.$dirty ? v$.password.$errors?.[0]?.$message : ''"
                        autocapitalize="off"
                        autocomplete="new-password"
                        autocorrect="off"
                        is-password
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
                        is-password
                        placeholder="Повторите пароль"
                        required
                        @blur="v$.repeat.$touch()"
                        @input="v$.repeat.$reset()"
                    />
                </div>

                <div class="form__row">
                    <ui-button
                        :disabled="success || inProgress"
                        @click.left.exact.prevent="onSubmit"
                    >
                        {{ isOnlyPassword ? 'Изменить пароль' : 'Восстановить пароль' }}
                    </ui-button>

                    <ui-button
                        v-if="!isAuthenticated"
                        type-link
                        @click.left.exact.prevent="$emit('switch:auth')"
                    >
                        Авторизация
                    </ui-button>
                </div>
            </form>
        </template>
    </page-layout>
</template>

<script>
    import useVuelidate from '@vuelidate/core';
    import {
        helpers, or, sameAs
    } from '@vuelidate/validators';
    import {
        computed, defineComponent, onBeforeMount, reactive, ref
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useToast } from 'vue-toastification';
    import { useRoute, useRouter } from 'vue-router';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import UiInput from '@/components/UI/kit/UiInput.vue';
    import { useUserStore } from '@/store/UI/UserStore';
    import {
        validateEmailFormat,
        validateMinLength,
        validatePwdLowerCase,
        validatePwdNumber,
        validatePwdSpecial,
        validatePwdUpperCase,
        validateRequired,
        validateUsernameSpecialChars
    } from '@/common/helpers/authChecks';
    import { ToastEventBus } from '@/common/utils/ToastConfig';
    import PageLayout from '@/components/content/PageLayout.vue';
    import { useAxios } from '@/common/composition/useAxios';

    export default defineComponent({
        components: {
            PageLayout,
            UiButton,
            UiInput
        },
        emits: ['close', 'switch:auth'],
        setup(props, { emit }) {
            const http = useAxios();
            const route = useRoute();
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
                repeat: ''
            });

            const token = computed(() => route.query.token);

            const tokenValidation = ref({
                correct: true,
                message: ''
            });

            const isOnlyPassword = computed(() => token.value || isAuthenticated.value);

            const validations = computed(() => {
                if (isOnlyPassword.value) {
                    return {
                        email: {
                            format: or(
                                validateUsernameSpecialChars(),
                                validateEmailFormat()
                            )
                        },
                        password: {
                            required: validateRequired(),
                            minLength: validateMinLength(8),
                            lowerCase: validatePwdLowerCase(),
                            upperCase: validatePwdUpperCase(),
                            numbers: validatePwdNumber(),
                            specialChars: validatePwdSpecial()
                        },
                        repeat: {
                            required: validateRequired(),
                            sameAs: helpers.withMessage('Пароли не совпадают', sameAs(computed(() => state.password)))
                        }
                    };
                }

                return {
                    email: {
                        required: validateRequired(),
                        format: validateEmailFormat()
                    }
                };
            });

            const v$ = useVuelidate(validations.value, state, { $lazy: true });

            async function sendQuery() {
                if (!isAuthenticated.value && !tokenValidation.value.correct) {
                    return Promise.reject(tokenValidation.value.message);
                }

                if (isOnlyPassword.value) {
                    try {
                        const payload = {
                            password: state.password,
                            [isAuthenticated.value ? 'userToken' : 'resetToken']: isAuthenticated.value
                                ? userStore.getUserToken()
                                : token.value
                        };

                        await userStore.changePassword(payload);

                        toast.success('Пароль успешно изменен!', {
                            onClose: () => {
                                if (!token.value) {
                                    return;
                                }

                                router.replace({ name: 'index' });
                            }
                        });

                        emit('close');

                        return Promise.resolve();
                    } catch (err) {
                        return Promise.reject(err);
                    }
                }

                try {
                    await userStore.resetPassword(state.email);

                    toast.success('Ссылка для изменения пароля отправлена на указанный e-mail');

                    emit('close');

                    return Promise.resolve();
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            const checkToken = async () => {
                if (isAuthenticated.value) {
                    return Promise.resolve();
                }

                try {
                    const resp = await http.get({ url: `/auth/token/validate?token=${ route.query.token }` });

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

            async function onSubmit() {
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

            onBeforeMount(async () => {
                await checkToken();
            });

            return {
                isAuthenticated,
                inProgress,
                isOnlyPassword,
                v$,
                error,
                success,
                token,
                tokenValidation,
                onSubmit
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
