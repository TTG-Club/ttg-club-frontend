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

<script>
    import {
        computed, defineComponent, onBeforeMount, ref
    } from 'vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
    import CustomBookmarkGroup from '@/features/bookmarks/components/CustomBookmarks/CustomBookmarkGroup.vue';
    import UiInput from '@/components/UI/kit/UiInput.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useUIStore } from '@/store/UI/UIStore';

    export default defineComponent({
        name: 'CustomBookmarks',
        components: {
            UiButton,
            UiInput,
            CustomBookmarkGroup,
            SvgIcon
        },
        setup() {
            const uiStore = useUIStore();
            const customBookmarkStore = useCustomBookmarkStore();
            const bookmarks = computed(() => customBookmarkStore.getGroupBookmarks);
            const isEdit = ref(false);
            const isGroupCreating = ref(false);
            const newGroupName = ref('');

            function enableGroupCreating() {
                isGroupCreating.value = true;
                newGroupName.value = '';
            }

            function disableGroupCreating() {
                isGroupCreating.value = false;
                newGroupName.value = '';
            }

            async function createGroup() {
                await customBookmarkStore.queryAddBookmark({
                    name: newGroupName.value,
                    order: customBookmarkStore.getGroupBookmarks.length
                });

                disableGroupCreating();
            }

            onBeforeMount(() => {
                customBookmarkStore.restoreOpenedGroupsFromSession();
            });

            return {
                test: computed(() => customBookmarkStore.bookmarks),
                bookmarks,
                isEdit,
                isGroupCreating,
                newGroupName,
                enableGroupCreating,
                disableGroupCreating,
                createGroup,
                isMobile: computed(() => uiStore.isMobile)
            };
        }
    });
</script>
