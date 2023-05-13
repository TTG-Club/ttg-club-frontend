<template>
    <ui-button
        v-tippy="{ content: 'Добавить в закладки' }"
        class="default-bookmark-button"
        is-icon
        type-link-filled
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
    import { useRoute } from 'vue-router';
    import {
        computed, defineComponent, ref
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from '@/common/helpers/toast';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useDefaultBookmarkStore } from '@/store/UI/bookmarks/DefaultBookmarkStore';
    import { useCustomBookmarkStore } from '@/store/UI/bookmarks/CustomBookmarksStore';
    import { useUserStore } from '@/store/UI/UserStore';

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
            const userStore = useUserStore();
            const { isAuthenticated } = storeToRefs(userStore);
            const defaultBookmarkStore = useDefaultBookmarkStore();
            const customBookmarkStore = useCustomBookmarkStore();
            const inProgress = ref(false);

            const bookmarkUrl = computed(() => (
                typeof props.url === 'string' && props.url !== ''
                    ? props.url
                    : route.path
            ));

            const isSaved = computed(() => {
                if (isAuthenticated.value) {
                    return customBookmarkStore.isBookmarkSavedInDefault(bookmarkUrl.value);
                }

                return defaultBookmarkStore.isBookmarkSaved(bookmarkUrl.value);
            });

            const handleBookmarkUpdate = async () => {
                if (isAuthenticated.value) {
                    const defaultGroup = await customBookmarkStore.getDefaultGroup();

                    return customBookmarkStore.updateBookmarkInGroup({
                        url: bookmarkUrl.value,
                        name: props.name,
                        groupUUID: defaultGroup.uuid
                    });
                }

                return defaultBookmarkStore.updateBookmark(bookmarkUrl.value, props.name);
            };

            async function updateBookmark() {
                if (inProgress.value) {
                    return;
                }

                try {
                    inProgress.value = true;

                    const bookmark = await handleBookmarkUpdate();

                    toast.success(`Закладка ${ bookmark ? 'добавлена' : 'удалена' }!`);
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
        padding: 6px;
        border: 0;

        &:hover {
            position: relative;
            z-index: 2;
        }
    }
</style>
