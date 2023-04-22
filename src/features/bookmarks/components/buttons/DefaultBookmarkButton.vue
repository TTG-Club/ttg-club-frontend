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

<script lang="ts" setup>
    import { useRoute } from 'vue-router';
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from '@/common/helpers/toast';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useDefaultBookmarkStore } from '@/features/bookmarks/store/DefaultBookmarkStore';
    import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
    import { useUserStore } from '@/store/UI/UserStore';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    const props = withDefaults(defineProps<{
        name?: string;
        url?: string;
    }>(), {
        name: '',
        url: ''
    });

    const route = useRoute();
    const userStore = useUserStore();
    const { isAuthenticated } = storeToRefs(userStore);
    const defaultBookmarkStore = useDefaultBookmarkStore();
    const customBookmarkStore = useCustomBookmarkStore();
    const inProgress = ref(false);

    const bookmarkUrl = computed(() => (props.url !== '' ? props.url : route.path));

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

    const updateBookmark = async () => {
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
    };
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
