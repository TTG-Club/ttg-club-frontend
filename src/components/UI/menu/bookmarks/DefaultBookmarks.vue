<template>
    <div class="bookmarks is-default">
        <div class="bookmarks__header">
            <div class="bookmarks__info">
                <span class="bookmarks__info--title">Закладки</span>

                <a
                    v-tippy="{
                        content: 'Больше возможностей.',
                    }"
                    href="/bookmarks_info"
                    target="_blank"
                    class="bookmarks__info--info"
                >
                    <svg-icon icon-name="menu-question"/>
                </a>
            </div>
        </div>

        <div class="bookmarks__wrapper">
            <div class="bookmarks__body">
                <div
                    v-for="(group, groupKey) in defaultBookmarkStore.getGroupBookmarks"
                    :key="group.uuid + groupKey"
                    class="bookmarks__group"
                >
                    <div class="bookmarks__group_body">
                        <div
                            v-for="(category, catKey) in group.children"
                            :key="category.uuid + catKey"
                            class="bookmarks__cat"
                        >
                            <div class="bookmarks__cat_label">
                                <div class="bookmarks__cat_label_name">
                                    {{ category.name }}
                                </div>
                            </div>

                            <div class="bookmarks__cat_body">
                                <div
                                    v-for="(bookmark, bookmarkKey) in category.children"
                                    :key="bookmark.uuid + bookmarkKey"
                                    class="bookmarks__item"
                                >
                                    <a
                                        :href="bookmark.url"
                                        :target="isExternal(bookmark.url) ? '_blank' : '_self'"
                                        class="bookmarks__item_label"
                                    >{{ bookmark.name }}</a>

                                    <div
                                        class="bookmarks__item_icon only-hover is-right"
                                        @click.left.exact.prevent="defaultBookmarkStore.removeBookmark(bookmark.url)"
                                    >
                                        <svg-icon icon-name="close"/>
                                    </div>
                                </div>

                                <div
                                    v-if="!category.children?.length"
                                    class="bookmarks__info"
                                >
                                    <div class="bookmarks__info--desc">
                                        Здесь пока пусто
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="!group.children?.length"
                            class="bookmarks__info"
                        >
                            <div class="bookmarks__info--desc">
                                Здесь пока пусто
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="!defaultBookmarkStore.getGroupBookmarks?.length"
                    class="bookmarks__info"
                >
                    <div class="bookmarks__info--desc">
                        Здесь пока пусто
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { useDefaultBookmarkStore } from "@/store/UI/bookmarks/DefaultBookmarkStore";

    export default {
        name: "DefaultBookmarks",
        data: () => ({
            defaultBookmarkStore: useDefaultBookmarkStore()
        }),
        methods: {
            isExternal(url) {
                return url.startsWith('http');
            }
        }
    };
</script>

<style lang="scss" scoped>
    .bookmarks {
        &__header {
            padding: 12px 16px;
        }

        &__info {
            display: flex;
            align-items: center;
            width: 100%;

            &--title {
                width: 100%;
            }

            &--info {
                width: 24px;
                height: 24px;
                display: block;
            }
        }
    }
</style>
