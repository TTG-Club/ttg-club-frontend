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

<script>
    import { mapActions } from "pinia";
    import useVuelidate from "@vuelidate/core";
    import { helpers, sameAs } from "@vuelidate/validators";
    import UiInput from "@/components/form/UiInput";
    import UiButton from "@/components/form/UiButton";
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

    export default {
        name: 'RegistrationView',
        components: {
            UiInput,
            UiButton
        },
        setup: () => ({
            v$: useVuelidate()
        }),
        data: () => ({
            username: '',
            email: '',
            password: '',
            repeat: '',
            success: false,
            inProgress: false
        }),
        methods: {
            ...mapActions(useUserStore, ['registration', 'authorization']),

            successHandler() {
                this.success = true;

                this.$toast.success("Вы успешно зарегистрировались!");
                this.$emit('close');
            },

            onError(text) {
                this.$toast.error(text);
            },

            async onSubmit() {
                this.inProgress = true;

                await this.v$.$reset();

                const result = await this.v$.$validate();

                if (!result) {
                    this.onError("Проверьте правильность заполнения полей");

                    this.inProgress = false;

                    return;
                }

                try {
                    await this.registration({
                        username: this.username.trim(),
                        email: this.email.trim(),
                        password: this.password.trim()
                    });

                    await this.authorization({
                        usernameOrEmail: this.username.trim(),
                        password: this.password.trim(),
                        remember: false
                    });

                    this.successHandler();
                } catch (err) {
                    this.onError('Неизвестная ошибка');
                } finally {
                    this.inProgress = false;
                }
            }
        },
        validations() {
            return {
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
                    sameAs: helpers.withMessage('Пароли не совпадают', sameAs(this.password))
                }
            };
        }
    };
</script>
