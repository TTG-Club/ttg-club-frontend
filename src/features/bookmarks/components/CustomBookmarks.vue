<template>
    <div class="bookmarks is-custom">
        <div class="bookmarks__header">
            <div class="bookmarks__info">
                <span
                    class="bookmarks__info--title"
                >Закладки <sup class="beta">β</sup>
                </span>
            </div>

            <ui-button
                is-icon
                is-small
                type-link-filled
                class="bookmarks__to-top"
                @click.left.prevent="scrollToTop"
            >
                <svg-icon icon-name="arrow-stroke" />
            </ui-button>

            <ui-button
                v-tippy="{ content: 'Перейти в режим редактирования' }"
                :type-link-filled="!isEdit"
                is-icon
                is-small
                @click.left.exact.prevent="isEdit = !isEdit"
            >
                <svg-icon
                    icon-name="edit"
                    :stroke-enable="false"
                    fill-enable
                />
            </ui-button>

            <label
                v-if="false"
                class="bookmarks__search"
            >
                <span class="bookmarks__search--icon">
                    <svg-icon icon-name="search" />
                </span>
            </label>
        </div>

        <div
            ref="wrapper"
            class="bookmarks__wrapper"
        >
            <div class="bookmarks__body">
                <custom-bookmark-group
                    v-for="(group, groupKey) in bookmarks"
                    :key="group.uuid + groupKey"
                    :group="group"
                    :is-edit="isEdit"
                    :is-first="!groupKey"
                />

                <div
                    v-if="isGroupCreating"
                    class="bookmarks__input"
                >
                    <ui-input
                        v-model="newGroupName"
                        autofocus
                        placeholder="Название группы"
                        @keyup.enter.exact.prevent="createGroup"
                    />

                    <ui-button
                        is-icon
                        is-small
                        type-link-filled
                        @click.left.exact.prevent="createGroup"
                    >
                        <svg-icon icon-name="check" />
                    </ui-button>

                    <ui-button
                        is-icon
                        is-small
                        type-link-filled
                        @click.left.exact.prevent="disableGroupCreating"
                    >
                        <svg-icon icon-name="close" />
                    </ui-button>
                </div>

                <ui-button
                    v-else
                    class="bookmarks__new"
                    is-small
                    type-link-filled
                    @click.left.exact.prevent="enableGroupCreating"
                >
                    <template #icon-left>
                        <svg-icon
                            :stroke-enable="false"
                            fill-enable
                            icon-name="plus"
                        />
                    </template>

                    <template #default>
                        Добавить группу
                    </template>
                </ui-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {
        computed, onBeforeMount, ref
    } from 'vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
    import CustomBookmarkGroup from '@/features/bookmarks/components/CustomBookmarks/CustomBookmarkGroup.vue';
    import UiInput from '@/components/UI/kit/UiInput.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';

    const customBookmarkStore = useCustomBookmarkStore();
    const bookmarks = computed(() => customBookmarkStore.getGroupBookmarks);
    const isEdit = ref(false);
    const isGroupCreating = ref(false);
    const newGroupName = ref('');
    const wrapper = ref<HTMLDivElement>();

    const enableGroupCreating = () => {
        isGroupCreating.value = true;
        newGroupName.value = '';
    };

    const disableGroupCreating = () => {
        isGroupCreating.value = false;
        newGroupName.value = '';
    };

    const createGroup = async () => {
        await customBookmarkStore.queryAddBookmark({
            name: newGroupName.value,
            order: customBookmarkStore.getGroupBookmarks.length
        });

        disableGroupCreating();
    };

    const scrollToTop = () => {
        wrapper.value?.scroll({
            top: 0,
            behavior: 'smooth'
        });
    };

    onBeforeMount(() => {
        customBookmarkStore.restoreOpenedGroupsFromSession();
    });
</script>
