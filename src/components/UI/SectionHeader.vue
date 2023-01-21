<template>
    <div class="section-header">
        <div class="section-header__body">
            <div class="section-header__title">
                <div
                    class="section-header__title--text"
                    @click.left.exact.prevent.stop="copyText(title)"
                >
                    {{ title }}
                </div>

                <a
                    v-if="copy"
                    v-tippy="{ content: 'Скопировать ссылку' }"
                    :href="urlForCopy"
                    class="section-header__title--copy"
                    @click.left.exact.prevent.stop="copyURL"
                >
                    <svg-icon icon-name="copy" />
                </a>
            </div>

            <div
                v-if="subtitle"
                class="section-header__subtitle"
                @click.left.exact.prevent.stop="copyText(subtitle)"
            >
                {{ subtitle }}
            </div>
        </div>

        <div
            v-if="hasControls"
            class="section-header__controls"
        >
            <bookmark-save-button
                v-if="bookmark"
                :name="title"
                :url="url"
            />

            <ui-button
                v-if="print"
                v-tippy="{ content: 'Открыть окно печати' }"
                class="section-header__control is-only-desktop"
                is-icon
                type-link-filled
                @click.left.exact.prevent.stop="openPrintWindow"
            >
                <svg-icon
                    icon-name="print"
                    :stroke-enable="false"
                    fill-enable
                />
            </ui-button>

            <ui-button
                v-if="onExportFoundry"
                v-tippy="{ content: 'Импорт в Foundry VTT. <a href=&quot;/fvtt_import&quot;>Инструкция</a>' }"
                class="section-header__control is-only-desktop"
                is-icon
                type-link-filled
                @click.left.exact.prevent.stop="$emit('exportFoundry')"
            >
                <svg-icon icon-name="export-foundry" />
            </ui-button>

            <ui-button
                v-if="fullscreen"
                v-tippy="{
                    content: uiStore.fullscreen
                        ? 'Свернуть окно'
                        : 'Развернуть окно',
                }"
                class="section-header__control is-only-desktop"
                is-icon
                type-link-filled
                @click.left.exact.prevent.stop="uiStore.toggleFullscreen"
            >
                <svg-icon
                    :icon-name="uiStore.fullscreen ? 'exit-fullscreen' : 'fullscreen'"
                    :stroke-enable="false"
                    fill-enable
                />
            </ui-button>

            <ui-button
                v-if="closeAvailable"
                v-tippy="{ content: 'Закрыть' }"
                class="section-header__control"
                is-icon
                type-link-filled
                @click.left.exact.prevent.stop="$emit('close')"
            >
                <svg-icon
                    icon-name="close"
                    :stroke-enable="false"
                    fill-enable
                />
            </ui-button>
        </div>
    </div>
</template>

<script lang="tsx">
    import { useClipboard } from '@vueuse/core';
    import { computed, defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useToast } from 'vue-toastification';
    import { useUIStore } from '@/store/UI/UIStore';
    import BookmarkSaveButton from '@/components/UI/menu/bookmarks/buttons/BookmarkSaveButton.vue';
    import UiButton from '@/components/form/UiButton.vue';
    import SvgIcon from "@/components/UI/icons/SvgIcon.vue";
    import { ToastEventBus } from '@/common/utils/ToastConfig';

    export default defineComponent({
        components: {
            UiButton,
            BookmarkSaveButton,
            SvgIcon
        },
        props: {
            title: {
                type: String,
                required: true
            },
            subtitle: {
                type: String,
                default: ''
            },
            copy: {
                type: Boolean,
                default: false
            },
            bookmark: {
                type: Boolean,
                default: false
            },
            url: {
                type: String,
                default: ''
            },
            print: {
                type: Boolean,
                default: false
            },
            fullscreen: {
                type: Boolean,
                default: false
            },
            closeOnDesktop: {
                type: Boolean,
                default: false
            },
            onClose: {
                type: Function,
                default: null
            },
            onExportFoundry: {
                type: Function,
                default: null
            }
        },
        setup(props) {
            const route = useRoute();
            const uiStore = useUIStore();
            const clipboard = useClipboard();
            const toast = useToast(ToastEventBus);
            const urlForCopy = computed(() => window.location.origin + route.path);

            const hasControls = computed(() => !!props.bookmark
                || !!props.print
                || !!props.onExportFoundry
                || !!props.onClose
                || !!props.fullscreen);

            const closeAvailable = computed(() => {
                if (!uiStore.isMobile) {
                    return props.closeOnDesktop;
                }

                return props.onClose;
            });

            const copyURL = () => {
                if (!clipboard.isSupported) {
                    toast.error('Ваш браузер не поддерживает копирование');
                }

                clipboard.copy(urlForCopy.value)
                    .then(() => toast('Ссылка успешно скопирована'))
                    .catch(() => toast.error((
                      <span>
                        Произошла какая-то ошибка... попробуйте еще раз или обратитесь за помощью на нашем
                        <a
                          target="_blank"
                          href="https://discord.gg/zqBnMJVf3z"
                          rel="noopener"
                        >
                          Discord-канале
                        </a>
                      </span>
                    )));
            };

            const copyText = (text?: string) => {
                if (!text) {
                    return;
                }

                clipboard.copy(text)
                    .then(() => toast('Текст скопирован'));
            };

            const openPrintWindow = () => {
                window.print();
            };

            return {
                uiStore,
                hasControls,
                urlForCopy,
                closeAvailable,
                copyText,
                copyURL,
                openPrintWindow
            };
        }
    });
</script>

<style lang="scss" scoped>
    .section-header {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
        flex-wrap: nowrap;
        flex-shrink: 0;
        padding: 12px 12px 0 24px;

        &__body {
            flex: 1 1 auto;
        }

        &__title {
            display: flex;
            align-items: center;

            &--text {
                font-size: var(--h4-font-size);
                line-height: var(--h4-line-height);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                position: relative;
                color: var(--text-color-title);
                font-weight: 400;
                cursor: pointer;
            }

            &--copy {
                @include css_anim();

                display: none;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                margin-left: 6px;
                padding: 4px;
                border-radius: 8px;
                color: var(--primary);
                background-color: transparent;
                cursor: pointer;
                flex-shrink: 0;
                transform: translateY(2px);

                @media (min-width: 800px) {
                    display: flex;

                    &:hover {
                        background-color: var(--primary-hover);
                        color: var(--text-btn-color);
                    }
                }
            }
        }

        &__subtitle {
            font-size: calc(var(--h2-font-size) - 14px);
            color: var(--text-g-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: normal;
            cursor: pointer;

            @media (max-width: 1200px) {
                margin-top: 4px;
            }
        }

        &__controls {
            display: flex;
            align-items: flex-start;
            flex-shrink: 0;
        }

        &__control {
            @include css_anim();

            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            cursor: pointer;
            color: var(--primary);
            padding: 6px;
            border-radius: 8px;

            @include media-min($md) {
                &:hover {
                    background-color: var(--primary-hover);
                    color: var(--text-btn-color);
                }
            }

            &.is-only-desktop {
                display: none;

                @include media-min($lg) {
                    display: flex;
                }
            }

            svg {
                width: 24px;
                height: 24px;
            }
        }
    }
</style>
