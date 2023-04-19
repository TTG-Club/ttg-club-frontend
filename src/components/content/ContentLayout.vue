<template>
    <div
        ref="container"
        :class="{ 'is-showed-right-side': showRightSide }"
        class="content-layout"
    >
        <div
            :class="{ 'is-fullscreen': fullscreen }"
            class="content-layout__body"
        >
            <div
                :class="{
                    'is-fullscreen': fullscreen,
                    'is-showed-right-side': showRightSide,
                }"
                class="content-layout__side--left"
            >
                <div
                    ref="fixedContainer"
                    class="content-layout__fixed"
                >
                    <div class="content-layout__fixed_body">
                        <h1
                            v-if="$slots.title"
                            class="content-layout__title"
                        >
                            <slot name="title" />
                        </h1>

                        <h1
                            v-else-if="title"
                            class="content-layout__title"
                        >
                            {{ title }}
                        </h1>

                        <div
                            v-if="filterInstance"
                            class="content-layout__filter"
                        >
                            <list-filter
                                :filter-instance="filterInstance"
                                @search="$emit('search', $event)"
                                @update="$emit('update', $event)"
                            />
                        </div>

                        <div
                            v-if="$slots.fixed"
                            class="content-layout__fixed_slot"
                        >
                            <slot name="fixed" />
                        </div>
                    </div>
                </div>

                <div
                    ref="leftSide"
                    :class="{ 'is-shadow': shadow || (showRightSide && fullscreen) }"
                    class="content-layout__side--left_body"
                >
                    <slot name="default" />
                </div>
            </div>

            <div
                v-if="showRightSide"
                ref="detail"
                :class="{ 'is-fullscreen': fullscreen }"
                class="content-layout__side--right"
            >
                <router-view
                    v-if="!$slots['right-side']"
                    @scroll-to-active="scrollToActive"
                    @scroll-to-last-active="scrollToLastActive"
                />

                <slot name="right-side" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import { defineComponent, ref } from 'vue';
    import {
        useElementBounding,
        useEventListener, useInfiniteScroll, useResizeObserver
    } from '@vueuse/core';
    import { storeToRefs } from 'pinia';
    import { useUIStore } from '@/store/UI/UIStore';
    import ListFilter from '@/components/filter/ListFilter.vue';
    import type { FilterComposable } from '@/common/composition/useFilter';

    export default defineComponent({
        components: { ListFilter },
        props: {
            showRightSide: {
                type: Boolean,
                default: false
            },
            title: {
                type: String,
                default: null
            },
            filterInstance: {
                type: Object as PropType<FilterComposable>,
                default: undefined
            }
        },
        setup(props, { emit }) {
            const uiStore = useUIStore();

            const {
                isMobile,
                fullscreen,
                bodyElement
            } = storeToRefs(uiStore);

            const container = ref<HTMLDivElement | null>(null);
            const leftSide = ref<HTMLDivElement | null>(null);
            const fixedContainer = ref<HTMLDivElement | null>(null);
            const shadow = ref(false);

            const fixedContainerRect = useElementBounding(fixedContainer);

            const scrollToActive = (oldLink?: Element) => {
                if (isMobile.value) {
                    return;
                }

                if (!leftSide.value) {
                    return;
                }

                const link = oldLink || leftSide.value.querySelector('.router-link-active');

                if (!link) {
                    return;
                }

                const rect = link.getBoundingClientRect();

                if (!bodyElement.value || !rect?.top && rect?.top !== 0) {
                    return;
                }

                fixedContainerRect.update();

                bodyElement.value.scroll({
                    top: rect.top + uiStore.bodyScroll.y - fixedContainerRect.height.value,
                    behavior: 'smooth'
                });
            };

            const scrollToLastActive = (url: string) => {
                if (isMobile.value) {
                    return;
                }

                if (!leftSide.value) {
                    return;
                }

                const link = leftSide.value.querySelector(`[href="${ url }"]`)
                    ?.closest('.link-item-expand');

                if (!link) {
                    return;
                }

                setTimeout(() => {
                    scrollToActive(link);
                }, 350);
            };

            const toggleShadow = () => {
                if (!bodyElement.value || !container.value) {
                    return;
                }

                shadow.value
                    = uiStore.bodyScroll.y + bodyElement.value.offsetHeight < container.value.offsetHeight - 24;
            };

            const scrollHandler = () => {
                toggleShadow();
            };

            useInfiniteScroll(
                bodyElement,
                () => {
                    emit('list-end');
                },
                { distance: 1080 }
            );

            useEventListener(bodyElement, 'scroll', scrollHandler);
            useResizeObserver(bodyElement, scrollHandler);

            return {
                isMobile,
                fullscreen,
                shadow,
                leftSide,
                fixedContainer,
                container,
                scrollToActive,
                scrollToLastActive
            };
        }
    });
</script>

<style lang="scss" scoped>
    .content-layout {
        width: 100%;
        max-width: var(--max-content);
        min-height: calc(var(--max-vh) - 56px);
        margin: 0 auto;

        &__body {
            width: 100%;
            min-height: calc(var(--max-vh) - 56px);
            display: flex;
            justify-content: flex-start;
            position: relative;

            &.is-fullscreen {
                border-radius: 12px;
            }

            @include media-min($md) {
                min-height: var(--max-vh);
            }
        }

        &__title {
            font-size: calc(var(--h1-font-size) - 10px);
            font-weight: 400;
        }

        &__fixed {
            position: sticky;
            top: 0;
            z-index: 3;
            pointer-events: none;
            padding-bottom: 16px;

            &:after {
                content: '';
                display: block;
                position: absolute;
                bottom: 0;
                height: 16px;
                width: 100%;
                background: linear-gradient(
                        180deg,
                        var(--bg-main) 0,
                        var(--bg-main) 15%,
                        transparent 80%,
                        transparent 90%,
                        transparent 100%
                );
            }

            &_body {
                pointer-events: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding-top: 16px;
                background-color: var(--bg-main);

                @include media-min($md) {
                    gap: 16px;
                }

                @include media-min($xl) {
                    padding-top: 24px;
                }
            }
        }

        &__side {
            &--left {
                display: flex;
                flex-direction: column;
                position: relative;
                width: 100%;
                flex-shrink: 0;

                ::-webkit-scrollbar-track {
                    background-color: transparent;

                    &:hover {
                        background-color: transparent;
                    }
                }

                &.is-fullscreen {
                    border-radius: 12px;
                }

                &.is-showed-right-side {
                    width: 100%;

                    @include media-min($xl) {
                        width: 40%;
                    }
                }

                &_body {
                    &:after {
                        content: '';
                        display: block;
                        pointer-events: none;
                        width: calc(100% + 16px);
                        height: 24px;
                        box-shadow: 0 0 32px 32px var(--bg-main);
                        position: sticky;
                        bottom: 0;
                        margin: 0 -16px;
                        //z-index: 16;
                        opacity: 0;
                        background-color: var(--bg-main);
                        transition: opacity 0.2s;
                        border: {
                            top-left-radius: 20%;
                            top-right-radius: 20%;
                        };
                    }

                    &.is-shadow {
                        &:after {
                            opacity: 1;
                        }
                    }
                }
            }

            &--right {
                display: block;
                top: 0;
                left: 0;
                right: 0;
                height: calc(var(--max-vh) - 56px);
                overflow: hidden;
                border-radius: 0;
                background-color: var(--bg-secondary);
                position: fixed;
                margin-left: auto;
                z-index: 12;

                @include media-min($md) {
                    left: 56px;
                    height: var(--max-vh);
                }

                @include media-min($xl) {
                    left: 0;
                    top: 24px;
                    position: sticky;
                    width: calc(60% - 24px);
                    height: calc(var(--max-vh) - 24px - 24px);
                    border-radius: 12px;
                }

                &.is-fullscreen {
                    width: 100%;
                    max-width: 100%;
                    margin-left: initial;
                    height: calc(var(--max-vh) - 56px);

                    @include media-min($xl) {
                        width: var(--max-content);
                        max-width: var(--max-content);
                        margin-left: -40%;
                        z-index: 16;
                    }
                }
            }
        }

        @include media-min($md) {
            min-height: var(--max-vh);
        }
    }
</style>
