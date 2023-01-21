<template>
    <vue-final-modal
        v-slot="{ close }"
        content-class="auth-reg-modal"
        esc-to-close
        focus-trap
        v-bind="$attrs"
    >
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
    </vue-final-modal>
</template>

<script>
    import { defineComponent } from 'vue';
    import UiButton from '@/components/form/UiButton.vue';

    export default defineComponent({
        components: { UiButton },
        props: {
            title: {
                type: String,
                default: ''
            }
        }
    });
</script>

<style lang="scss" scoped>
    ::v-deep(.auth-reg-modal) {
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

    .auth-reg-modal {
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
            }
        }

        &__form {
            margin-top: 24px;
        }
    }
</style>
