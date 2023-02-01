<template>
    <a
        v-if="searchLink"
        :href="searchLink.url"
        class="search-link"
    >
        <div class="search-link__label">
            {{ searchLink.name }}
        </div>

        <div class="search-link__desc">
            {{ searchLink.section }}
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
            }
        }
    });
</script>

<style lang="scss" scoped>
    .search-link {
        @include css_anim();

        display: block;
        padding: 6px 12px;
        color: var(--text-color-title);
        user-select: none;

        &__desc {
            margin-top: 4px;
            font-style: italic;
            font-size: 13px;
            opacity: .4;
            color: var(--text-color);
        }

        &:hover {
            background: var(--hover);
        }
    }
</style>
