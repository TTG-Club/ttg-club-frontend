<template>
    <a
        v-if="searchLink"
        ref="link"
        :href="searchLink.url"
        class="search-link"
        :class="{ 'is-selected': selected, 'is-hover-disabled': disableHover }"
    >
        <div class="search-link__label">
            {{ searchLink.name }}
        </div>

        <div class="search-link__section">
            {{ searchLink.section }}
        </div>

        <div
            v-if="searchLink.description && showDesc"
            class="search-link__desc"
        >
            {{ searchLink.description }}
        </div>
    </a>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import {
        defineComponent, ref, watch
    } from 'vue';
    import { useFocus } from '@vueuse/core';
    import type { TSearchResult } from '@/types/Search/Search.types';

    export default defineComponent({
        props: {
            searchLink: {
                type: Object as PropType<TSearchResult>,
                default: null,
                required: true
            },
            showDesc: {
                type: Boolean,
                default: false
            },
            disableHover: {
                type: Boolean,
                default: false
            },
            selected: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const link = ref<HTMLElement | null>(null);
            const { focused } = useFocus(link);

            watch(
                () => props.selected,
                value => {
                    focused.value = value;
                }
            );

            return {
                link,
                focused
            };
        }
    });
</script>

<style lang="scss" scoped>
    .search-link {
        @include css_anim();

        display: block;
        padding: 10px 12px;
        color: var(--text-color-title);
        user-select: none;

        &__section {
            margin-top: 4px;
            font-style: italic;
            font-size: 13px;
            opacity: .4;
            color: var(--text-color);
        }

        &__desc {
            margin-top: 4px;
            color: var(--text-color);
            white-space: nowrap;
            max-width: 100%;
            display: inline-block;
            overflow: hidden;
            text-overflow: ellipsis;

            @include media-min($xl) {
                white-space: initial;
            }
        }

        &:hover {
            &:not(.is-hover-disabled):not(.is-selected) {
                background: var(--hover);
            }
        }

        &.is-selected {
            @include css_anim();

            background: var(--hover);
        }
    }
</style>
