<template>
    <div
        v-if="type === 'crumb'"
        v-tippy="tooltip"
        :class="{ 'is-active': value }"
        class="ui-checkbox ui-checkbox--crumb"
        @click.left.exact.prevent="value = !value"
    >
        <div class="ui-checkbox__label">
            <slot/>
        </div>
    </div>

    <div
        v-else-if="type === 'toggle'"
        :class="{ 'is-active': value }"
        class="ui-checkbox ui-checkbox--toggle"
        @click.left.exact.prevent="value = !value"
    >
        <div class="ui-checkbox__faker"/>

        <div
            v-if="$slots.default"
            class="ui-checkbox__label"
        >
            <slot/>
        </div>
    </div>
</template>

<script>
    import { defineComponent } from "vue";

    export default defineComponent({
        props: {
            modelValue: {
                type: Boolean,
                default: false
            },
            type: {
                type: String,
                default: 'crumb',
                validator: value => ['crumb', 'toggle'].includes(value)
            },
            tooltip: {
                type: String,
                default: ''
            }
        },
        emits: ['update:model-value'],
        computed: {
            value: {
                get() {
                    return this.modelValue;
                },
                set(value) {
                    this.$emit('update:model-value', value);
                }
            }
        }
    });
</script>

<style lang="scss" scoped>
    .ui-checkbox {
        cursor: pointer;

        &--crumb {
            display: inline-block;
            width: fit-content;

            .ui-checkbox {
                &__label {
                    @include css_anim();

                    display: inline-block;
                    padding: 6px 10px;
                    border-radius: 16px;
                    background-color: var(--hover);
                    color: var(--text-color);
                }
            }

            &.is-active {
                .ui-checkbox {
                    &__label {
                        @include css_anim();

                        background-color: var(--primary-active);
                        color: var(--text-btn-color);
                    }
                }
            }

            @include media-min($md) {
                &:not(.is-active) {
                    .ui-checkbox__label {
                        &:hover {
                            background-color: var(--primary-hover);
                            color: var(--text-btn-color);
                        }
                    }
                }
            }
        }

        &--toggle {
            display: inline-flex;
            align-items: center;

            .ui-checkbox {
                &__faker {
                    @include css_anim();

                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    width: 34px;
                    height: 20px;
                    border: 2px solid transparent;
                    background-color: var(--hover);
                    border-radius: 26px;
                    padding: 1px;
                    flex-shrink: 0;

                    &:after {
                        @include css_anim();

                        content: '';
                        display: block;
                        border-radius: 50%;
                        background-color: var(--text-btn-color);
                        width: 14px;
                        height: 14px;
                    }
                }

                &__label {
                    margin-left: 4px;
                }
            }

            &.is-active {
                .ui-checkbox {
                    &__faker {
                        background-color: var(--primary);

                        &:after {
                            transform: translateX(100%);
                        }
                    }
                }
            }

            @include media-min($md) {
                &:hover {
                    .ui-checkbox {
                        &__faker {
                            border-color: #aef;
                        }
                    }
                }
            }
        }
    }
</style>
