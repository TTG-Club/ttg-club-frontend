<template>
    <div
        class="bookmarks__group"
        :class="{ 'is-active': isOpened(group.uuid) }"
    >
        <div
            class="bookmarks__group_head"
            @click.left.exact.prevent="toggleGroup(group.uuid)"
        >
            <div
                class="bookmarks__group_icon"
                :class="{ 'is-active': isOpened(group.uuid) }"
            >
                <svg-icon icon-name="arrow-stroke"/>
            </div>

            <div class="bookmarks__group_label">
                {{ group.name || 'Без категории' }}
            </div>

            <div
                v-if="isOpened(group.uuid) && group.order > -1"
                v-tippy="{ content: 'Добавить категорию' }"
                class="bookmarks__group_icon is-right"
                :class="{ 'only-hover': !isMobile }"
                @click.left.exact.prevent.stop="enableCategoryCreating"
            >
                <svg-icon
                    icon-name="plus"
                    :stroke-enable="false"
                    fill-enable
                />
            </div>

            <div
                v-if="!isMobile || (isMobile && isEdit)"
                class="bookmarks__group_icon is-right"
                :class="{ 'only-hover': !isMobile }"
                @click.left.exact.prevent.stop="removeBookmark(group.uuid)"
            >
                <svg-icon icon-name="close"/>
            </div>
        </div>

        <div
            v-if="isOpened(group.uuid)"
            class="bookmarks__group_body"
        >
            <draggable
                tag="div"
                :model-value="group.children"
                item-key="uuid"
                handle=".js-drag-category"
                group="category"
                ghost-class="bookmarks__cat_ghost"
                chosen-class="bookmarks__cat_chosen"
                drag-class="bookmarks__cat_drag"
                @change="onChangeHandler"
            >
                <template #item="{ element: category }">
                    <custom-bookmark-category
                        :key="category.uuid + category.order"
                        :category="category"
                        :group="group"
                        :is-edit="isEdit"
                    />
                </template>
            </draggable>

            <div
                v-if="isCategoryCreating"
                class="bookmarks__input"
            >
                <ui-input
                    v-model="newCategoryName"
                    placeholder="Название категории"
                    autofocus
                    @keyup.enter.exact.prevent="createCategory"
                />

                <ui-button
                    type-link-filled
                    is-small
                    is-icon
                    @click.left.exact.prevent="createCategory"
                >
                    <svg-icon icon-name="check"/>
                </ui-button>

                <ui-button
                    type-link-filled
                    is-small
                    is-icon
                    @click.left.exact.prevent="disableCategoryCreating"
                >
                    <svg-icon icon-name="close"/>
                </ui-button>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        computed, defineComponent, onBeforeMount, ref
    } from "vue";
    import draggableComponent from 'vuedraggable';
    import UiInput from "@/components/form/UiInput";
    import UiButton from "@/components/form/UiButton";
    import CustomBookmarkCategory from "@/components/UI/menu/bookmarks/CustomBookmarks/CustomBookmarkCategory";
    import { useCustomBookmarkStore } from "@/store/UI/bookmarks/CustomBookmarksStore";
    import { useUIStore } from "@/store/UI/UIStore";
    import SvgIcon from "@/components/UI/icons/SvgIcon";

    export default defineComponent({
        components: {
            CustomBookmarkCategory,
            UiInput,
            UiButton,
            Draggable: draggableComponent,
            SvgIcon
        },
        props: {
            group: {
                type: Object,
                default: () => ({})
            },
            isFirst: {
                type: Boolean,
                default: false
            },
            isEdit: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const uiStore = useUIStore();
            const customBookmarkStore = useCustomBookmarkStore();
            const isCategoryCreating = ref(false);
            const newCategoryName = ref('');

            function enableCategoryCreating() {
                if (props.group.order > -1) {
                    isCategoryCreating.value = true;
                    newCategoryName.value = '';
                }
            }

            function disableCategoryCreating() {
                isCategoryCreating.value = false;
                newCategoryName.value = '';
            }

            async function createCategory() {
                await customBookmarkStore.queryAddBookmark({
                    name: newCategoryName.value,
                    order: props.group.children.length,
                    parentUUID: props.group.uuid
                });

                disableCategoryCreating();
            }

            async function updateBookmark(change) {
                if (!change) {
                    return;
                }

                const {
                    element: { uuid, name },
                    newIndex: order
                } = change;

                await customBookmarkStore.queryUpdateBookmark({
                    uuid,
                    name,
                    order,
                    parentUUID: props.group.uuid
                });
            }

            async function onChangeHandler(e) {
                const { added, moved } = e;

                await updateBookmark(added || moved);
            }

            function openFirstGroup() {
                if (!props.isFirst) {
                    return;
                }

                if (customBookmarkStore.getOpenedGroups.length > 0) {
                    return;
                }

                customBookmarkStore.toggleGroup(props.group.uuid);
            }

            onBeforeMount(() => openFirstGroup());

            return {
                isCategoryCreating,
                newCategoryName,
                enableCategoryCreating,
                disableCategoryCreating,
                createCategory,
                removeBookmark: customBookmarkStore.queryDeleteBookmark,
                onChangeHandler,
                isOpened: customBookmarkStore.isGroupOpened,
                toggleGroup: customBookmarkStore.toggleGroup,
                isMobile: computed(() => uiStore.isMobile)
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
