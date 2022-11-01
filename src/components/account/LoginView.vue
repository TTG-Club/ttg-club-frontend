<template>
    <form
        class="login form"
        @keyup.enter.exact.prevent="onSubmit"
        @submit.prevent="onSubmit"
    >
        <div class="form__row">
            <ui-input
                v-model.trim="v$.usernameOrEmail.$model"
                placeholder="Логин или электронная почта"
                autocomplete="username"
                autocapitalize="off"
                autocorrect="off"
                required
                :error-text="v$.usernameOrEmail.$dirty ? v$.usernameOrEmail.$errors?.[0]?.$message : ''"
                @input="v$.usernameOrEmail.$reset()"
                @blur="v$.usernameOrEmail.$touch()"
            />
        </div>

        <div class="form__row">
            <ui-input
                v-model.trim="v$.password.$model"
                placeholder="Пароль"
                is-password
                required
                autocomplete="current-password"
                autocapitalize="off"
                autocorrect="off"
                :error-text="v$.password.$dirty ? v$.password.$errors?.[0]?.$message : ''"
                @input="v$.password.$reset()"
                @blur="v$.password.$touch()"
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

<script>
    import { mapActions } from "pinia";
    import useVuelidate from "@vuelidate/core/dist/index.esm";
    import { helpers, or } from "@vuelidate/validators";
    import UiInput from "@/components/form/UiInput";
    import UiCheckbox from "@/components/form/UiCheckbox";
    import UiButton from "@/components/form/UiButton";
    import { useUserStore } from "@/store/UI/UserStore";
    import {
        validateEmailFormat,
        validatePwdSpecial,
        validateRequired,
        validateUsernameSpecialChars
    } from "@/common/helpers/authChecks";

    export default {
        name: 'LoginView',
        components: {
            UiButton,
            UiCheckbox,
            UiInput
        },
        setup: () => ({
            v$: useVuelidate()
        }),
        data: () => ({
            usernameOrEmail: '',
            password: '',
            remember: true,
            inProgress: false,
            success: false
        }),
        methods: {
            ...mapActions(useUserStore, ['authorization']),

            successHandler() {
                this.success = true;

                this.$toast.success("Вы успешно авторизовались!");
                this.$emit('close');
            },

            onError(text) {
                this.$toast.error(text);
            },

            async onSubmit() {
                this.inProgress = true;

                await this.v$.$reset();

                const result = await this.v$.$validate();

                if (this.success || !result) {
                    this.onError("Проверьте правильность заполнения полей");

                    this.inProgress = false;

                    return;
                }

                try {
                    await this.authorization({
                        usernameOrEmail: this.usernameOrEmail.trim(),
                        password: this.password.trim(),
                        remember: this.remember
                    });

                    this.successHandler();
                } catch (err) {
                    const { response } = err;

                    if (!response?.status) {
                        this.onError('Неизвестная ошибка');

                        return;
                    }

                    switch (response.status) {
                        case 401:
                            this.onError('Неверный логин или пароль');

                            break;
                        default:
                            this.onError('Неизвестная ошибка');

                            break;
                    }
                } finally {
                    this.inProgress = false;
                }
            }
        },
        validations() {
            return {
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
            };
        }
    };
</script>
