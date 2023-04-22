<template>
    <default-bookmark-button v-bind="$props" />

    <custom-bookmark-button
        v-if="isAuthenticated"
        v-bind="$props"
    />
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import DefaultBookmarkButton from '@/features/bookmarks/components/buttons/DefaultBookmarkButton.vue';
    import CustomBookmarkButton from '@/features/bookmarks/components/buttons/CustomBookmarkButton.vue';
    import { useUserStore } from '@/store/UI/UserStore';

    withDefaults(defineProps<{
        name?: string;
        url?: string;
    }>(), {
        name: '',
        url: ''
    });

    const { isAuthenticated } = storeToRefs(useUserStore());
</script>
