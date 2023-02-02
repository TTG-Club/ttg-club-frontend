<template>
    <a
        v-if="searchLink"
        :href="searchLink.url"
        class="search-link"
    >
        <div class="search-link__label">
            {{ searchLink.name }}
        </div>

        <div class="search-link__section">
            {{ searchLink.section }}
        </div>

        <div
            v-if="searchLink.description"
            class="search-link__desc"
        >
            {{ searchLink.description }}
        </div>
    </a>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import { defineComponent } from 'vue';
    import type { TSearchResult } from '@/types/Search/Search.types';

    export default defineComponent({
        props: {
            searchLink: {
                type: Object as PropType<TSearchResult>,
                default: null
            },
            showDesc: {
                type: Boolean,
                default: false
            }
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
            background: var(--hover);
        }
    }
</style>
