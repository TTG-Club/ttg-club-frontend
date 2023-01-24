<template>
    <page-layout
        :use-social-links="false"
        :show-separator="false"
        class="search-view"
    >
        <template #title>
            Поиск по сайту
        </template>

        <template #default>
            <div class="search-view__filter">
                .
            </div>

            <div class="search-view__results" />

            <div class="search-view__pagination" />
        </template>
    </page-layout>
</template>

<script>
    import { defineComponent } from 'vue';
    import PageLayout from '@/components/content/PageLayout.vue';

    export default defineComponent({
        components: { PageLayout }
    });
</script>

<style lang="scss" scoped>

</style>
