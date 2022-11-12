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
                v-if="isMobile"
                v-tippy="{ content: 'Перейти в режим редактирования' }"
                is-small
                is-icon
                :type-link-filled="!isEdit"
                @click.left.exact.prevent="isEdit = !isEdit"
            >
                <svg-icon icon-name="edit"/>
            </ui-button>

            <label
                v-if="false"
                class="bookmarks__search"
            >
                <span class="bookmarks__search--icon">
                    <svg-icon icon-name="search"/>
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
                    :is-first="!groupKey"
                    :is-edit="isEdit"
                />

                <div
                    v-if="isGroupCreating"
                    class="bookmarks__input"
                >
                    <ui-input
                        v-model="newGroupName"
                        placeholder="Название группы"
                        autofocus
                        @keyup.enter.exact.prevent="createGroup"
                    />

                    <ui-button
                        type-link-filled
                        is-small
                        is-icon
                        @click.left.exact.prevent="createGroup"
                    >
                        <svg-icon icon-name="check"/>
                    </ui-button>

                    <ui-button
                        type-link-filled
                        is-small
                        is-icon
                        @click.left.exact.prevent="disableGroupCreating"
                    >
                        <svg-icon icon-name="close"/>
                    </ui-button>
                </div>

                <ui-button
                    v-else
                    class="bookmarks__new"
                    type-link-filled
                    is-small
                    @click.left.exact.prevent="enableGroupCreating"
                >
                    <template #icon-left>
                        <svg-icon
                            icon-name="plus"
                            :stroke-enable="false"
                            fill-enable
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
    } from "vue";
    import SvgIcon from "@/components/UI/icons/SvgIcon.vue";
    import { useCustomBookmarkStore } from "@/store/UI/bookmarks/CustomBookmarksStore";
    import CustomBookmarkGroup from "@/components/UI/menu/bookmarks/CustomBookmarks/CustomBookmarkGroup.vue";
    import UiInput from "@/components/form/UiInput.vue";
    import UiButton from "@/components/form/UiButton.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default defineComponent({
        name: "CustomBookmarks",
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
