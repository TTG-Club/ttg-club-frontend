<template>
    <div class="nav-popover">
        <div
            class="nav-popover__trigger"
            :class="{ 'is-active': isShow }"
        >
            <slot
                :is-active="isShow"
                name="trigger"
            />
        </div>

        <transition name="fade">
            <div
                v-if="isShow"
                class="nav-popover__bg"
                @click.left.exact.self.prevent.stop="onClose"
            />
        </transition>

        <transition name="nav-popover-animation">
            <div
                v-if="isShow"
                :class="classes"
                class="nav-popover__body"
            >
                <slot
                    name="default"
                    :close="onClose"
                />
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import {
        computed, defineComponent
    } from 'vue';
    import { useVModel } from '@vueuse/core';

    export default defineComponent({
        props: {
            modelValue: {
                type: Boolean,
                default: false
            },
            isMenu: {
                type: Boolean,
                default: false
            },
            isLeft: {
                type: Boolean,
                default: false
            }
        },
        setup(props, { emit }) {
            const isShow = useVModel(props, 'modelValue');

            return {
                isShow,

                classes: computed(() => ({
                    'is-left': props.isLeft,
                    'is-menu': props.isMenu
                })),

                onClose: () => {
                    isShow.value = false;

                    emit('close');
                }
            };
        }
    });
</script>

<style lang="scss" scoped>
    .nav-popover {
        position: relative;
        width: 40px;
        height: 40px;
        flex-shrink: 0;

        &__trigger {
            position: relative;
            width: 100%;
            height: 100%;

            &.is-active {
                z-index: 120;
            }
        }

        &__bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: var(--max-vh);
            background-color: var(--bg-light-main);
            transform: translate3d(0, 0, 0);
            z-index: 110;
            cursor: pointer;
        }

        &__body {
            pointer-events: auto;
            display: inline-block;
            cursor: auto;
            background-color: var(--bg-secondary);
            overflow: auto;
            border-radius: 8px;
            box-shadow: 0 0 27px #0006;
            transform-origin: top right;
            z-index: 111;
            position: absolute;
            top: 0;
            left: initial;
            right: 0;
            max-width: 800px;
            max-height: calc(var(--max-vh) / 100 * 90);

            @media (max-width: 800px) {
                max-width: 550px;
            }

            @media (max-width: 550px) {
                position: fixed;
                width: calc(100vw - 16px);
                max-height: calc(var(--max-vh) - 16px);
                left: 8px;
                top: 56px;
            }

            &.is-left {
                transform-origin: top left;
                left: 0;
                right: initial;
            }

            &.is-menu {
                width: 100vw;

                @media (max-width: 550px) {
                    position: absolute;
                    top: 0;
                    width: calc(100vw - 16px);
                    height: calc(var(--max-vh) - 16px);
                    max-height: calc(var(--max-vh) - 16px);
                }
            }
        }
    }

    .nav-popover-animation {
        &-enter-from, &-leave-to {
            opacity: 0;
            transform: scale(0) translate3d(0, 0, 0);
            z-index: -1;
        }

        &-enter-to, &-leave-from {
            opacity: 1;
            transform: scale(1) translate3d(0, 0, 0);
            z-index: 111;
        }

        &-enter-active, &-leave-active {
            @include css_anim($time: .25s, $style: cubic-bezier(0.215, 0.61, 0.355, 1));
        }
    }
</style>
