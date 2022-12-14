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
                :class="{ 'is-fullscreen': fullscreen, 'is-showed-right-side': showRightSide }"
                class="content-layout__side--left"
            >
                <div
                    v-if="filterInstance"
                    class="content-layout__filter"
                >
                    <div class="content-layout__filter_body">
                        <list-filter
                            :filter-instance="filterInstance"
                            @search="$emit('search', $event)"
                            @update="$emit('update', $event)"
                        />
                    </div>
                </div>

                <div
                    v-if="$slots.fixed"
                    class="content-layout__side--left_fixed"
                >
                    <slot name="fixed"/>
                </div>

                <div
                    ref="leftSide"
                    :class="{ 'is-shadow': shadow || (showRightSide && fullscreen) }"
                    class="content-layout__side--left_body"
                >
                    <slot name="default"/>
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

                <slot name="right-side"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import {
        useEventListener, useInfiniteScroll, useResizeObserver
    } from '@vueuse/core';
    import { storeToRefs } from 'pinia';
    import {
        defineComponent, ref
    } from 'vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import ListFilter from "@/components/filter/ListFilter.vue";
    import type { FilterComposable } from '@/common/composition/useFilter';

    export default defineComponent({
        components: { ListFilter },
        props: {
            showRightSide: {
                type: Boolean,
                default: false
            },
            filterInstance: {
                type: Object as PropType<FilterComposable>,
                default: undefined
            }
        },
        setup(props, { emit }) {
            const uiStore = useUIStore();

            const {
                isMobile, fullscreen, bodyElement
            } = storeToRefs(uiStore);

            const container = ref<HTMLDivElement | null>(null);
            const leftSide = ref<HTMLDivElement | null>(null);
            const shadow = ref(false);

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

                bodyElement.value.scroll({
                    top: rect.top + uiStore.bodyScroll.y,
                    behavior: "smooth"
                });
            };

            const scrollToLastActive = (url: string) => {
                if (isMobile.value) {
                    return;
                }

                if (!leftSide.value) {
                    return;
                }

                const link = leftSide.value.querySelector(`[href="${ url }"]`)?.closest('.link-item-expand');

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
        margin: 0 auto;

        &__body {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            position: relative;

            &.is-fullscreen {
                border-radius: 12px;
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

                    @include media-min($sm) {
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
                right: 0;
                width: calc(60% - 24px);
                height: calc(var(--max-vh) - 56px - 24px);
                overflow: hidden;
                border-radius: 12px;
                background-color: var(--bg-secondary);
                position: sticky;
                margin-left: auto;
                z-index: 12;

                @media (max-width: 1200px) {
                    width: 100%;
                    height: calc(var(--max-vh) - 56px);
                    position: fixed;
                    top: 56px;
                    left: 0;
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                }

                @media (max-width: 600px) {
                    top: 0;
                    border-radius: 0;
                }

                &.is-fullscreen {
                    width: var(--max-content);
                    max-width: var(--max-content);
                    height: calc(var(--max-vh) - 56px - 24px);
                    margin-left: -40%;
                    z-index: 16;

                    @media (max-width: 1200px) {
                        width: 100%;
                        max-width: 100%;
                        margin-left: initial;
                        height: calc(var(--max-vh) - 56px);
                    }
                }
            }
        }

        &__filter {
            flex-shrink: 0;
            position: sticky;
            top: 0;
            z-index: 12;
            pointer-events: none;
            background: linear-gradient(
                    180deg,
                    var(--bg-main) 0,
                    var(--bg-main) 28px,
                    var(--bg-main) 48px,
                    transparent 68px
            );

            &_body {
                padding-bottom: 24px;

                ::v-deep(*) {
                    pointer-events: auto;
                }
            }

            &_dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 12;

                ::v-deep(*) {
                    pointer-events: auto;
                }
            }

            @media (max-width: 600px) {
                padding-top: 16px;
                background: linear-gradient(
                    180deg,
                    var(--bg-main) 0,
                    var(--bg-main) 38px,
                    var(--bg-main) 58px,
                    transparent 78px
                    )
            }
        }

        &__side--left_fixed {
            position: sticky;
            top: 0;
            z-index: 3;

            @media (max-width: 600px) {
                top: 16px;
            }
        }
    }
</style>
