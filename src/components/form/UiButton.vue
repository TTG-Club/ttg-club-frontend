<template>
    <button
        :class="classList"
        :disabled="disabled"
        class="ui-button"
        type="button"
    >
        <span
            v-if="$slots['icon-left']"
            class="ui-button__icon is-left"
        >
            <slot name="icon-left"/>
        </span>

        <span
            v-if="isIcon"
            class="ui-button__icon"
        >
            <slot name="default"/>
        </span>

        <span
            v-else
            class="ui-button__text"
        >
            <slot name="default"/>
        </span>

        <span
            v-if="$slots['icon-right']"
            class="ui-button__icon is-right"
        >
            <slot name="icon-right"/>
        </span>
    </button>
</template>

<script>
    import { computed, defineComponent } from "vue";

    export default defineComponent({
        props: {
            typeLink: {
                type: Boolean,
                default: false
            },
            typeLinkFilled: {
                type: Boolean,
                default: false
            },
            typePrimary: {
                type: Boolean,
                default: true
            },
            disabled: {
                type: Boolean,
                default: false
            },
            isIcon: {
                type: Boolean,
                default: false
            },
            isSmall: {
                type: Boolean,
                default: false
            },
            isLarge: {
                type: Boolean,
                default: false
            },
            useFullWidth: {
                type: Boolean,
                default: false
            }
        },

        setup(props) {
            const type = computed(() => {
                if (props.typeLink) {
                    return 'link';
                }

                if (props.typeLinkFilled) {
                    return 'link-filled';
                }

                return 'primary';
            });

            const classList = computed(() => {
                const list = [`is-${ type.value }`];

                if (props.isSmall) {
                    list.push('is-small');
                }

                if (props.isLarge) {
                    list.push('is-large');
                }

                if (props.useFullWidth) {
                    list.push('is-full-width');
                }

                return list;
            });

            return {
                type,
                classList
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ui-button {
        @include css_anim();

        background-color: var(--primary);
        color: var(--text-btn-color);
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        flex-shrink: 0;
        font-size: var(--main-font-size);
        line-height: calc(var(--main-line-height) - 1px);

        & + & {
            margin-left: 16px;
        }

        @include media-min($xl) {
            &:hover {
                @include css_anim();

                background-color: var(--primary-hover);
            }

            &:active,
            &.is-active {
                @include css_anim();

                background-color: var(--primary-active);
            }
        }

        &:disabled {
            opacity: .6;
            background-color: var(--primary);
            cursor: not-allowed;
        }

        &__text {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        &__icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;

            &.is-left,
            &.is-right {
                padding: 2px;
            }

            &.is-left {
                margin-right: 12px;
            }

            &.is-right {
                margin-left: 12px;
            }
        }

        &.is-full-width {
            display: flex;
            width: 100%;
        }

        &.is-small {
            padding: 8px;

            & + & {
                margin-left: 8px;
            }

            .ui-button__icon {
                width: 20px;
                height: 20px;

                &.is-left,
                &.is-right {
                    padding: 2px;
                }

                &.is-left {
                    margin-right: 8px;
                }

                &.is-right {
                    margin-left: 8px;
                }
            }
        }

        &.is-large {
            padding: 16px;

            & + & {
                margin-left: 16px;
            }

            .ui-button__icon {
                width: 28px;
                height: 28px;

                &.is-left,
                &.is-right {
                    padding: 4px;
                }
            }
        }

        &.is-link {
            background-color: transparent;
            color: var(--primary);

            @include media-min($xl) {
                &:hover {
                    background-color: var(--bg-sub-menu);
                    color: var(--primary-hover);
                }

                &:active,
                &.is-active {
                    background-color: var(--bg-main);
                }
            }

            &:disabled {
                opacity: .6;
                background-color: transparent;
                color: var(--primary);
                cursor: not-allowed;
            }
        }

        &.is-link-filled {
            background-color: transparent;
            color: var(--primary);

            @include media-min($xl) {
                &:hover {
                    background-color: var(--hover);
                    color: var(--text-btn-color);
                }

                &:active,
                &.is-active {
                    background-color: var(--primary-active);
                    color: var(--text-btn-color);
                }
            }

            &:disabled {
                opacity: .6;
                background-color: transparent;
                color: var(--primary);
                cursor: not-allowed;
            }
        }
    }
</style>
