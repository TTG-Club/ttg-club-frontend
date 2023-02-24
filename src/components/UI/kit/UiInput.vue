<template>
    <label class="ui-input">
        <span
            v-if="label"
            class="ui-input__label"
        >
            {{ label }}
        </span>

        <span
            :class="{ 'is-error': errorText }"
            class="ui-input__control"
        >
            <input
                ref="input"
                v-model="value"
                :autocomplete="inputAutocomplete"
                :placeholder="placeholder"
                :spellcheck="false"
                :type="inputType"
                class="ui-input__input"
                v-bind="attrs"
                @blur="$emit('blur')"
            >

            <span
                v-if="isPassword"
                class="ui-input__control_icon"
                @click.left.exact.prevent="togglePass"
            >
                <svg-icon
                    :icon-name="showedPass ? 'hide-pass' : 'show-pass'"
                    :stroke-enable="false"
                    fill-enable
                />
            </span>
        </span>

        <span
            v-if="!!errorText"
            class="ui-input__error"
        >
            {{ errorText }}
        </span>
    </label>
</template>

<script>
    import { defineComponent } from 'vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default defineComponent({
        components: {
            SvgIcon
        },
        inheritAttrs: false,
        props: {
            modelValue: {
                type: [String, Number],
                default: ''
            },
            label: {
                type: String,
                default: ''
            },
            placeholder: {
                type: String,
                default: ''
            },
            autofocus: {
                type: Boolean,
                default: false
            },
            autocomplete: {
                type: [Boolean, String],
                default: false
            },
            type: {
                type: String,
                default: 'text'
            },
            isNumber: {
                type: Boolean,
                default: false
            },
            isPassword: {
                type: Boolean,
                default: false
            },
            isEmail: {
                type: Boolean,
                default: false
            },
            isError: {
                type: Boolean,
                default: false
            },
            min: {
                type: Number,
                default: undefined
            },
            required: {
                type: Boolean,
                default: false
            },
            errorText: {
                type: String,
                default: ''
            }
        },
        emits: ['update:modelValue', 'blur'],
        data: () => ({
            showedPass: false,
            error: {
                status: false,
                text: ''
            }
        }),
        computed: {
            value: {
                get() {
                    return this.modelValue;
                },

                set(e) {
                    this.$emit('update:modelValue', e);
                }
            },

            inputType() {
                if (this.isNumber) {
                    return 'number';
                }

                if (this.isPassword) {
                    return this.showedPass ? 'text' : 'password';
                }

                if (this.isEmail) {
                    return 'email';
                }

                return this.type;
            },

            inputAutocomplete() {
                switch (typeof this.autocomplete) {
                    case 'boolean':
                        return this.autocomplete ? 'on' : 'off';
                    case 'string':
                        return this.autocomplete;

                    default:
                        return 'off';
                }
            },

            attrs() {
                const attrs = { ...this.$attrs };

                if (this.isNumber) {
                    if (this.min !== undefined) {
                        attrs.min = this.min;
                    }
                }

                return attrs;
            }
        },
        mounted() {
            if (this.autofocus) {
                this.focusInput();
            }
        },
        methods: {
            focusInput() {
                if (this.$refs.input) {
                    this.$refs.input.focus();
                }
            },

            togglePass() {
                this.showedPass = !this.showedPass;

                this.$refs.input.focus();
            }
        }
    });
</script>

<style lang="scss" scoped>
    .ui-input {
        display: block;
        width: 100%;

        &__label {
            margin-bottom: 8px;
            display: block;
        }

        &__control {
            @include css_anim();

            border: 1px solid var(--border);
            background: var(--bg-sub-menu);
            border-radius: 8px;
            display: flex;
            overflow: hidden;
            width: 100%;

            &.is-error {
                border-color: var(--error);
            }

            &_icon {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 38px;
                width: 38px;
                cursor: pointer;
                padding: 10px;
                color: var(--text-color-title);
            }
        }

        &__input {
            width: 100%;
            background-color: transparent;
            color: var(--text-color);
            font-size: var(--main-font-size);
            height: 38px;
            font-family: 'Open Sans', serif;
            padding: 4px 12px;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            border: 0;
            flex: 1 1 auto;
        }

        &__error {
            color: var(--text-btn-color);
            font-size: calc(var(--main-font-size) - 2px);
            z-index: 1;
            padding: 0 6px;
            display: block;
            position: absolute;
            background-color: var(--error);
            border-radius: 4px;
            top: 32px;
            left: 8px;
        }

        &:focus-within {
            .ui-input {
                &__control {
                    @include css_anim();

                    border-color: var(--primary-active);
                }

                &__input {
                    background-color: transparent;
                }
            }
        }

        &:hover {
            .ui-input {
                &__control {
                    border-color: var(--primary-hover);
                }

                &__input {
                    background-color: transparent;
                }
            }
        }
    }
</style>
