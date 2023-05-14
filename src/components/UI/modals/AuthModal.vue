<template>
    <vue-final-modal
        v-slot="{ close }"
        class="auth-reg-modal"
        esc-to-close
        focus-trap
        overlay-transition="vfm-fade"
        content-transition="vfm-fade"
        v-bind="$attrs"
    >
        <div class="auth-reg-modal__container">
            <img
                :alt="title"
                class="auth-reg-modal__bg"
                src="/img/bg_login.png"
            >

            <div class="auth-reg-modal__content">
                <ui-button
                    class="auth-reg-modal__close"
                    is-icon
                    type-link
                    @click.left.exact.prevent="$emit('close')"
                >
                    <svg-icon icon-name="close" />
                </ui-button>

                <div class="auth-reg-modal__body">
                    <h4>{{ title }}</h4>

                    <div class="auth-reg-modal__form">
                        <slot
                            :close="close"
                            name="default"
                        />
                    </div>
                </div>
            </div>
        </div>
    </vue-final-modal>
</template>

<script lang="ts" setup>
    import { VueFinalModal } from 'vue-final-modal';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    withDefaults(defineProps<{
        title?: string;
    }>(), {
        title: ''
    });
</script>

<style lang="scss" scoped>
    .auth-reg-modal {
        &__container {
            background-color: var(--bg-secondary);
            max-height: calc(var(--max-vh) / 100 * 90);
            margin: auto;
            overflow: hidden;
            box-shadow: 0 0 12px -8px var(--bg-transparent);
            display: flex;
            width: 100%;
            max-width: 700px;

            @include media-min($sm) {
                border-radius: 8px;
            }
        }

        &__bg {
            width: 240px;
            object-fit: cover;
            display: none;

            @include media-min($md) {
                display: block;
            }
        }

        &__content {
            flex: 1 1 100%;
            max-height: var(--max-vh);
            padding: 16px;
            position: relative;
            overflow: auto;

            @include media-min($md) {
                padding: 48px;
            }
        }

        &__header {
            width: 100%;
            display: flex;
            justify-content: flex-end;
        }

        &__close {
            @include css_anim();

            padding: 4px;
            width: 40px;
            height: 40px;
            position: absolute;
            top: 12px;
            right: 12px;
        }

        &__body {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;

            h4 {
                margin: 0;
                pointer-events: none;
            }
        }

        &__form {
            margin-top: 24px;
        }
    }
</style>
