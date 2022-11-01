<template>
    <ui-button
        v-tippy="{ content: 'Добавить в закладки' }"
        class="default-bookmark-button"
        type-link-filled
        is-icon
        @click.left.exact.prevent.stop="updateBookmark"
        @dblclick.prevent.stop
    >
        <svg-icon
            :icon-name="isSaved ? 'bookmark-filled' : 'bookmark'"
            :stroke-enable="false"
            fill-enable
        />
    </ui-button>
</template>

<script>
    import { useRoute } from "vue-router";
    import {
        computed, defineComponent, ref
    } from "vue";
    import { useToast } from "vue-toastification";
    import UiButton from "@/components/form/UiButton";
    import { useDefaultBookmarkStore } from "@/store/UI/bookmarks/DefaultBookmarkStore";
    import { useCustomBookmarkStore } from "@/store/UI/bookmarks/CustomBookmarksStore";
    import { useUserStore } from "@/store/UI/UserStore";

    export default defineComponent({
        components: {
            UiButton
        },
        props: {
            name: {
                type: String,
                default: ''
            },
            url: {
                type: String,
                default: ''
            }
        },
        setup(props) {
            const route = useRoute();
            const toast = useToast();
            const userStore = useUserStore();
            const defaultBookmarkStore = useDefaultBookmarkStore();
            const customBookmarkStore = useCustomBookmarkStore();
            const inProgress = ref(false);

            const bookmarkUrl = computed(() => (
                typeof props.url === "string" && props.url !== ''
                    ? props.url
                    : route.path
            ));

            const isSaved = computed(() => {
                if (userStore.isAuthenticated) {
                    return customBookmarkStore.isBookmarkSavedInDefault(bookmarkUrl.value);
                }

                return defaultBookmarkStore.isBookmarkSaved(bookmarkUrl.value);
            });

            async function updateBookmark() {
                if (inProgress.value) {
                    return;
                }

                try {
                    inProgress.value = true;

                    if (userStore.isAuthenticated) {
                        const defaultGroup = await customBookmarkStore.getDefaultGroup();

                        await customBookmarkStore.updateBookmarkInGroup({
                            url: bookmarkUrl.value,
                            name: props.name,
                            groupUUID: defaultGroup.uuid
                        });

                        return;
                    }

                    await defaultBookmarkStore.updateBookmark(bookmarkUrl.value, props.name);
                } catch (err) {
                    toast.error('Произошла какая-то ошибка...');
                } finally {
                    inProgress.value = false;
                }
            }

            return {
                isSaved,
                updateBookmark
            };
        }
    });
</script>

<style lang="scss" scoped>
    .default-bookmark-button {
        width: 28px;
        z-index: 1;

        &:hover {
            position: relative;
            z-index: 2;
        }
    }
</style>
