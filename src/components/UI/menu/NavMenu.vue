<template>
    <nav-popover
        v-model="menu"
        is-left
        is-menu
    >
        <template #trigger="{ isActive }">
            <div
                :class="{ 'is-active': isActive }"
                class="navbar__btn hamburger"
                @click.left.exact.prevent="menu = !menu"
            >
                <span class="line" />

                <span class="line" />

                <span class="line" />
            </div>
        </template>

        <template #default>
            <div class="nav-menu">
                <div class="nav-menu__header">
                    <a
                        class="nav-menu__logo"
                        href="/"
                    >
                        <site-logo />
                    </a>

                    <div class="nav-menu__info">
                        <span class="nav-menu__info--desc">Онлайн справочник по D&D 5e</span>

                        <span class="nav-menu__info--title">TTG Club</span>
                    </div>
                </div>

                <div
                    v-if="navItems.length"
                    class="nav-menu__body"
                >
                    <div
                        v-for="(group, groupKey) in navItems"
                        :key="group.name + groupKey"
                        class="nav-menu__group"
                    >
                        <div class="nav-menu__group_label">
                            <div class="nav-menu__group_label">
                                {{ group.name }}
                            </div>

                            <div
                                v-if="group.icon"
                                class="nav-menu__group_icon"
                            >
                                <svg-icon :icon-name="group.icon" />
                            </div>
                        </div>

                        <div class="nav-menu__links">
                            <div
                                v-for="link in group.children"
                                :key="link.url"
                                class="nav-menu__link"
                            >
                                <a
                                    :href="link.url"
                                    :target="link.external ? '_blank' : '_self'"
                                    class="nav-menu__link_label"
                                >{{ link.name }}</a>

                                <div
                                    :class="{ 'is-active': isSaved(link.url) }"
                                    class="nav-menu__link_icon only-hover"
                                    @click.left.exact.stop.prevent="updateBookmark(link.url, link.name)"
                                    @dblclick.prevent.stop
                                >
                                    <svg-icon
                                        :icon-name="isSaved(link.url)
                                            ? 'bookmark-dot-filled'
                                            : 'bookmark-dot'
                                        "
                                        :stroke-enable="false"
                                        fill-enable
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </nav-popover>
</template>

<script>
    import { defineComponent, ref } from 'vue';
    import { tryOnBeforeMount } from '@vueuse/core';
    import { storeToRefs } from 'pinia';
    import { useNavStore } from '@/store/UI/NavStore';
    import { useDefaultBookmarkStore } from '@/store/UI/bookmarks/DefaultBookmarkStore';
    import NavPopover from '@/components/UI/menu/NavPopover.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import SiteLogo from '@/components/UI/icons/SiteLogo.vue';
    import { useUserStore } from '@/store/UI/UserStore';
    import { useCustomBookmarkStore } from '@/store/UI/bookmarks/CustomBookmarksStore';

    export default defineComponent({
        name: 'NavMenu',
        components: {
            NavPopover,
            SvgIcon,
            SiteLogo
        },
        setup() {
            const menu = ref(false);
            const navStore = useNavStore();
            const userStore = useUserStore();
            const defaultBookmarkStore = useDefaultBookmarkStore();
            const customBookmarkStore = useCustomBookmarkStore();
            const inProgressURLs = ref([]);
            const { navItems } = storeToRefs(navStore);

            tryOnBeforeMount(async () => {
                navItems.value = await navStore.getNavItems();
            });

            const isSaved = url => {
                if (userStore.isAuthenticated) {
                    return customBookmarkStore.isBookmarkSavedInDefault(url);
                }

                return defaultBookmarkStore.isBookmarkSaved(url);
            };

            async function updateBookmark(url, name) {
                if (inProgressURLs.value.includes(url)) {
                    return;
                }

                if (await userStore.getUserStatus()) {
                    inProgressURLs.value.push(url);

                    const defaultGroup = await customBookmarkStore.getDefaultGroup();

                    await customBookmarkStore.updateBookmarkInGroup({
                        url,
                        name,
                        category: 'menu',
                        groupUUID: defaultGroup.uuid
                    });

                    inProgressURLs.value = inProgressURLs.value.filter(item => item !== url);

                    return;
                }

                await defaultBookmarkStore.updateBookmark(url, name, 'menu');
            }

            return {
                menu,
                navItems,
                isSaved,
                updateBookmark
            };
        }
    });
</script>

<style lang="scss" scoped>
    .nav-menu {
        padding: 16px 16px 8px 16px;

        &__header {
            padding: 16px 16px 16px 16px;
            display: flex;
            align-items: center;

            @media (max-width: 600px) {
                padding: 16px 16px 16px 16px;
            }
        }

        &__logo {
            margin-right: 12px;
            width: 80px;
            height: 80px;
            flex-shrink: 0;

            @media (max-width: 600px) {
                width: 60px;
                height: 60px;
            }
        }

        &__info {
            display: flex;
            flex-direction: column;
            justify-content: center;

            &--desc {
                font-size: var(--h5-font-size);
                margin-bottom: 4px;
            }

            &--title {
                font-size: var(--h3-font-size);
                font-weight: 600;
            }

            &--desc,
            &--title {
                color: var(--text-b-color);
            }
        }

        &__body {
            padding: 8px 8px 0 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 48px;
            border-top: 1px solid var(--hover);

            @media (max-width: 600px) {
                gap: 0;
            }
        }

        &__links {
            padding: 0 8px;
        }

        &__group {
            display: flex;
            flex-direction: column;
            width: 240px;
            margin: 8px 0;

            @media (max-width: 600px) {
                width: 100%;
            }

            &_label {
                padding: 8px 8px 4px 8px;
                display: flex;
                opacity: 0.8;
                color: var(--text-g-color);
                font-size: inherit;
                font-weight: normal;
                width: 100%;
                position: relative;
                align-items: center;

                .nav-menu__group_label {
                    background: var(--bg-secondary);
                    align-items: center;

                    &::after {
                        content: '';
                        width: 100%;
                        height: 1px;
                        background-color: var(--text-g-color);
                        position: relative;
                        left: 8px;
                        top: 0;
                    }
                }
            }

            &_icon {
                width: 32px;
                height: 32px;
                padding: 4px;
                flex-shrink: 0;
            }
        }

        &__link {
            @include css_anim();

            display: flex;
            border-radius: 6px;

            &_label {
                @include css_anim();

                color: var(--text-color);
                font-weight: 400;
                padding: 8px;
                width: 100%;
                display: flex;
                border-radius: 6px;
                font-size: var(--main-font-size);
            }

            &_icon {
                @include css_anim();

                width: 32px;
                height: 32px;
                padding: 8px;
                flex-shrink: 0;

                &.only-hover {
                    &:not(.is-active) {
                        opacity: 0;
                    }
                }

                svg {
                    stroke: var(--text-color) !important;
                }
            }

            &:hover {
                .nav-menu {
                    &__link {
                        &_icon {
                            &.only-hover {
                                opacity: 1;
                            }
                        }

                        &_label,
                        &_icon {
                            cursor: pointer;
                            color: var(--text-btn-color);
                        }

                        &_label {
                            background-color: var(--primary-hover);
                        }
                    }
                }
            }
        }
    }
</style>
