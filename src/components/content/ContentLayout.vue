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
                    ref="items"
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

<script>
    import { useInfiniteScroll, useResizeObserver } from "@vueuse/core";
    import { mapState } from "pinia";
    import { ref } from "vue";
    import { useUIStore } from '@/store/UI/UIStore';
    import ListFilter from "@/components/filter/ListFilter";
    import FilterService from "@/common/services/FilterService";

    export default {
        name: 'ContentLayout',
        components: { ListFilter },
        props: {
            showRightSide: {
                type: Boolean,
                default: false
            },
            filterInstance: {
                type: FilterService,
                default: undefined
            }
        },
        emits: [
            'list-end',
            'update',
            'search',
            'resize'
        ],
        data: () => ({
            shadow: false
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile', 'fullscreen'])
        },
        mounted() {
            const scrollEl = document.getElementById('dnd5club');

            useInfiniteScroll(
                ref(scrollEl),
                () => {
                    this.$emit('list-end');
                },
                { distance: 1080 }
            );

            scrollEl.addEventListener('scroll', this.scrollHandler);

            useResizeObserver(scrollEl, this.scrollHandler);
        },
        beforeUnmount() {
            const scrollEl = document.getElementById('dnd5club');

            scrollEl.removeEventListener('scroll', this.scrollHandler);
        },
        methods: {
            scrollToLastActive(url) {
                if (this.isMobile) {
                    return;
                }

                const { items } = this.$refs;

                if (!items) {
                    return;
                }

                const link = items.querySelector(`[href="${ url }"]`)?.closest('.link-item-expand');

                if (!link) {
                    return;
                }

                setTimeout(() => {
                    this.$nextTick(() => {
                        this.scrollToActive(link);
                    });
                }, 350);
            },

            scrollToActive(oldLink) {
                if (this.isMobile) {
                    return;
                }

                if (document.readyState !== "complete") {
                    this.scrollToActive(oldLink);

                    return;
                }

                const { items } = this.$refs;

                if (!items) {
                    return;
                }

                const link = oldLink || items.querySelector('.router-link-active');

                if (!link) {
                    return;
                }

                this.$nextTick(() => {
                    const scrollBody = document.getElementById('dnd5club');
                    const rect = link.getBoundingClientRect();

                    if (!rect?.top && rect?.top !== 0) {
                        return;
                    }

                    scrollBody.scroll({
                        top: rect.top - 112 + scrollBody.scrollTop,
                        behavior: "smooth"
                    });
                });
            },

            scrollHandler() {
                this.toggleShadow();
            },

            toggleShadow() {
                const scrollEl = document.getElementById('dnd5club');
                const container = document.getElementById('container');

                this.shadow = scrollEl.scrollTop + scrollEl.offsetHeight < container.offsetHeight - 24;
            }
        }
    };
</script>

<style lang="scss" scoped>
    .content-layout {
        width: 100%;

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
                    margin-bottom: -24px;

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
                top: 56px;
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
            margin-top: -56px;
            top: 0;
            padding-top: 56px;
            z-index: 12;
            pointer-events: none;
            background: linear-gradient(
                    180deg,
                    var(--bg-main) 0,
                    var(--bg-main) 88px,
                    var(--bg-main) 88px,
                    transparent 124px
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
        }

        &__side--left_fixed {
            position: sticky;
            top: 56px;
            z-index: 3;
        }
    }
</style>
