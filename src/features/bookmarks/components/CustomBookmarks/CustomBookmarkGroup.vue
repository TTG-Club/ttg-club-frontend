<template>
    <div
        :class="{ 'is-active': isOpened(group.uuid) }"
        class="bookmarks__group"
    >
        <div
            class="bookmarks__group_head"
            @click.left.exact.prevent="toggleGroup(group.uuid)"
        >
            <div
                :class="{ 'is-active': isOpened(group.uuid) }"
                class="bookmarks__group_icon"
            >
                <svg-icon icon-name="arrow-stroke" />
            </div>

            <div class="bookmarks__group_label">
                {{ group.name || 'Без категории' }}
            </div>

            <div
                v-if="isOpened(group.uuid) && group.order > -1"
                v-tippy="{ content: 'Добавить категорию' }"
                :class="{ 'only-hover': !isMobile }"
                class="bookmarks__group_icon is-right"
                @click.left.exact.prevent.stop="enableCategoryCreating"
            >
                <svg-icon
                    :stroke-enable="false"
                    fill-enable
                    icon-name="plus"
                />
            </div>

            <div
                v-if="!isMobile || (isMobile && isEdit)"
                :class="{ 'only-hover': !isMobile }"
                class="bookmarks__group_icon is-right"
                @click.left.exact.prevent.stop="removeBookmark(group.uuid)"
            >
                <svg-icon
                    icon-name="close"
                    :stroke-enable="false"
                    fill-enable
                />
            </div>
        </div>

        <div
            v-if="isOpened(group.uuid)"
            class="bookmarks__group_body"
        >
            <draggable
                :model-value="group.children"
                chosen-class="bookmarks__cat_chosen"
                drag-class="bookmarks__cat_drag"
                ghost-class="bookmarks__cat_ghost"
                group="category"
                handle=".js-drag-category"
                item-key="uuid"
                tag="div"
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
                    autofocus
                    placeholder="Название категории"
                    @keyup.enter.exact.prevent="createCategory"
                />

                <ui-button
                    is-icon
                    is-small
                    type-link-filled
                    @click.left.exact.prevent="createCategory"
                >
                    <svg-icon icon-name="check" />
                </ui-button>

                <ui-button
                    is-icon
                    is-small
                    type-link-filled
                    @click.left.exact.prevent="disableCategoryCreating"
                >
                    <svg-icon icon-name="close" />
                </ui-button>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        computed, defineComponent, onBeforeMount, ref
    } from 'vue';
    import draggableComponent from 'vuedraggable';
    import UiInput from '@/components/UI/kit/UiInput.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import CustomBookmarkCategory from '@/features/bookmarks/components/CustomBookmarks/CustomBookmarkCategory.vue';
    import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
    import { useUIStore } from '@/store/UI/UIStore';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

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
                    element: {
                        uuid,
                        name
                    },
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
                const {
                    added,
                    moved
                } = e;

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
