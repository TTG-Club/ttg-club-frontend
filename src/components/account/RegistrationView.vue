<template>
    <form
        class="registration form"
        @submit.prevent="onSubmit"
        @keyup.enter.exact.prevent="onSubmit"
    >
        <div class="form__row">
            <ui-input
                v-model.trim="v$.username.$model"
                placeholder="Имя пользователя"
                autocomplete="username"
                autocapitalize="off"
                autocorrect="off"
                required
                :error-text="v$.username.$dirty ? v$.username.$errors?.[0]?.$message : ''"
                @input="v$.username.$reset()"
                @blur="v$.username.$touch()"
            />
        </div>

        <div class="form__row">
            <ui-input
                v-model.trim="v$.email.$model"
                placeholder="Электронный адрес"
                required
                autocomplete="email"
                autocapitalize="off"
                autocorrect="off"
                :error-text="v$.email.$dirty ? v$.email.$errors?.[0]?.$message : ''"
                @input="v$.email.$reset()"
                @blur="v$.email.$touch()"
            />
        </div>

        <div class="form__row">
            <ui-input
                v-model.trim="v$.password.$model"
                placeholder="Пароль"
                is-password
                required
                autocomplete="new-password"
                autocapitalize="off"
                autocorrect="off"
                :error-text="v$.password.$dirty ? v$.password.$errors?.[0]?.$message : ''"
                @input="v$.password.$reset()"
                @blur="v$.password.$touch()"
            />
        </div>

        <div class="form__row">
            <ui-input
                v-model.trim="v$.repeat.$model"
                placeholder="Повторите пароль"
                is-password
                required
                autocomplete="new-password"
                autocapitalize="off"
                autocorrect="off"
                :error-text="v$.repeat.$dirty ? v$.repeat.$errors?.[0]?.$message : ''"
                @input="v$.repeat.$reset()"
                @blur="v$.repeat.$touch()"
            />
        </div>

        <div class="form__row">
            <ui-button
                :disabled="success || inProgress"
                @click.left.exact.prevent="onSubmit"
            >
                Регистрация
            </ui-button>

            <ui-button
                type-link
                @click.left.exact.prevent="$emit('switch:auth')"
            >
                Авторизация
            </ui-button>
        </div>
    </form>
</template>

<script lang="ts">
    import {
        defineComponent, reactive, ref
    } from "vue";
    import useVuelidate from "@vuelidate/core";
    import { helpers, sameAs } from "@vuelidate/validators";
    import { useToast } from "vue-toastification";
    import UiInput from "@/components/form/UiInput.vue";
    import UiButton from "@/components/form/UiButton.vue";
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
        validateUsernameSpecialChars
    } from "@/common/helpers/authChecks";
    import { useUserStore } from "@/store/UI/UserStore";
    import { ToastEventBus } from "@/common/utils/ToastConfig";

    export default defineComponent({

        components: {
            UiInput,
            UiButton
        },
        setup(props, { emit }) {
            const userStore = useUserStore();
            const toast = useToast(ToastEventBus);
            const username = ref('');
            const email = ref('');
            const password = ref('');
            const repeat = ref('');
            const success = ref(false);
            const inProgress = ref(false);

            const rules = reactive({
                username: {
                    required: validateRequired(),
                    minLength: validateMinLength(5),
                    specialChars: validateUsernameSpecialChars(),
                    exist: validateUsernameExist()
                },
                email: {
                    required: validateRequired(),
                    format: validateEmailFormat(),
                    exist: validateEmailExist()
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
                    sameAs: helpers.withMessage('Пароли не совпадают', sameAs(password))
                }
            });

            const v$ = useVuelidate(rules, {
                username,
                email,
                password,
                repeat
            });

            const successHandler = () => {
                success.value = true;

                toast.success("Вы успешно зарегистрировались!");
                emit('close');
            };

            const onSubmit = async () => {
                inProgress.value = true;

                await v$.value.$reset();

                const result = await v$.value.$validate();

                if (!result) {
                    toast.error("Проверьте правильность заполнения полей");

                    inProgress.value = false;

                    return;
                }

                try {
                    await userStore.registration({
                        username: username.value.trim(),
                        email: email.value.trim(),
                        password: password.value.trim()
                    });

                    await userStore.authorization({
                        usernameOrEmail: username.value.trim(),
                        password: password.value.trim(),
                        remember: false
                    });

                    successHandler();
                } catch (err) {
                    toast.error('Неизвестная ошибка');
                } finally {
                    inProgress.value = false;
                }
            };

            return {
                v$,
                success,
                inProgress,
                onSubmit
            };
        }
    });
</script>
