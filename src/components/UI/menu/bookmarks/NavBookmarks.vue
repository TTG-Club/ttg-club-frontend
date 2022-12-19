<template>
    <nav-popover v-model="opened">
        <template #trigger="{ isActive }">
            <div
                class="navbar__btn"
                :class="{ 'is-active': isActive }"
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
                <default-bookmarks v-if="!isAuthenticated"/>

                <custom-bookmarks v-else/>
            </div>
        </template>
    </nav-popover>
</template>

<script>
    import {
        computed,
        onBeforeMount,
        ref, watch
    } from "vue";
    import { storeToRefs } from "pinia";
    import SvgIcon from "@/components/UI/icons/SvgIcon.vue";
    import NavPopover from "@/components/UI/menu/NavPopover.vue";
    import DefaultBookmarks from "@/components/UI/menu/bookmarks/DefaultBookmarks.vue";
    import CustomBookmarks from "@/components/UI/menu/bookmarks/CustomBookmarks.vue";
    import { useUserStore } from "@/store/UI/UserStore";
    import { useCustomBookmarkStore } from "@/store/UI/bookmarks/CustomBookmarksStore";
    import { useDefaultBookmarkStore } from "@/store/UI/bookmarks/DefaultBookmarkStore";

    export default {
        name: "NavBookmarks",
        components: {
            CustomBookmarks,
            DefaultBookmarks,
            NavPopover,
            SvgIcon
        },
        setup() {
            const opened = ref(false);
            const userStore = useUserStore();
            const { isAuthenticated } = storeToRefs(userStore);
            const defaultBookmarkStore = useDefaultBookmarkStore();
            const customBookmarkStore = useCustomBookmarkStore();

            const bookmarkIcon = computed(() => {
                const getIcon = value => (value ? 'bookmark-filled' : 'bookmark');

                if (isAuthenticated.value) {
                    return getIcon(customBookmarkStore.getBookmarks.filter(item => item.url).length > 0);
                }

                return getIcon(defaultBookmarkStore.getBookmarks.filter(item => item.url).length > 0);
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

            return {
                opened,
                clickHandler,
                bookmarkIcon,
                isAuthenticated
            };
        }
    };
</script>

<style lang="scss" scoped>
    .nav-bookmarks {
        display: flex;
        height: 100%;
        overflow: hidden;
    }
</style>
