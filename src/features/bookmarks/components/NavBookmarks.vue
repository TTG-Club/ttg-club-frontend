<template>
    <nav-popover
        v-model="opened"
        inner-scroll
    >
        <template #trigger="{ isActive }">
            <div
                :class="{ 'is-active': isActive }"
                class="navbar__btn"
                @click.left.exact.prevent="clickHandler"
            >
                <svg-icon
                    :icon-name="bookmarkIcon"
                    :stroke-enable="false"
                    fill-enable
                />
            </div>
        </template>

        <template #default>
            <div class="nav-bookmarks">
                <default-bookmarks v-if="!isAuthenticated" />

                <custom-bookmarks v-else />
            </div>
        </template>
    </nav-popover>
</template>

<script lang="ts" setup>
    import {
        computed, onBeforeMount, ref, watch
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import NavPopover from '@/components/UI/menu/NavPopover.vue';
    import DefaultBookmarks from '@/features/bookmarks/components/DefaultBookmarks.vue';
    import CustomBookmarks from '@/features/bookmarks/components/CustomBookmarks.vue';
    import { useUserStore } from '@/store/UI/UserStore';
    import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
    import { useDefaultBookmarkStore } from '@/features/bookmarks/store/DefaultBookmarkStore';

    const opened = ref(false);
    const userStore = useUserStore();
    const { isAuthenticated } = storeToRefs(userStore);
    const defaultBookmarkStore = useDefaultBookmarkStore();
    const customBookmarkStore = useCustomBookmarkStore();

    const bookmarkIcon = computed(() => {
        const getIcon = (value: boolean) => (value ? 'bookmark-filled' : 'bookmark');

        if (isAuthenticated.value) {
            return getIcon(customBookmarkStore.bookmarks.length > 0);
        }

        return getIcon(defaultBookmarkStore.bookmarks.length > 0);
    });

    const clickHandler = async () => {
        if (!opened.value) {
            await userStore.getUserStatus();
        }

        opened.value = !opened.value;
    };

    const restoreBookmarks = async () => {
        if (isAuthenticated.value) {
            await customBookmarkStore.queryGetBookmarks();

            return;
        }

        await defaultBookmarkStore.restoreBookmarks();
    };

    onBeforeMount(async () => {
        await restoreBookmarks();
    });

    watch(isAuthenticated, async () => {
        await restoreBookmarks();
    });
</script>

<style lang="scss">
    @import "../styles/bookmarks";

    .nav-bookmarks {
        display: flex;
        height: 100%;
        overflow: hidden;
    }
</style>
