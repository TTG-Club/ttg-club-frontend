<template>
    <content-detail class="class-detail">
        <template #fixed>
            <section-header
                :copy="!error && !loading"
                :subtitle="currentClass?.name?.eng || ''"
                :title="currentClass?.name?.rus || ''"
                bookmark
                print
                fullscreen
                close-on-desktop
                @close="close"
            />

            <div
                v-if="tabs.length"
                class="class-detail__tabs"
            >
                <div
                    v-for="(tab, tabKey) in tabs"
                    :key="tabKey"
                    :class="{ 'is-active': currentTab?.name === tab.name, 'is-only-icon': !tab.name }"
                    class="class-detail__tab"
                    @click.left.exact.prevent="clickTabHandler({ index: tabKey, callback: tab.callback })"
                >
                    <div class="class-detail__tab_icon">
                        <svg-icon :icon-name="`tab-${tab.type}`"/>
                    </div>

                    <div
                        v-if="tab.name"
                        class="class-detail__tab_name"
                    >
                        {{ tab.name }}
                    </div>
                </div>
            </div>

            <div
                v-if="isMobile && currentTab?.type === 'traits' && currentArchetypes.length"
                class="class-detail__select"
            >
                <ui-select
                    :group-select="false"
                    :model-value="currentSelectArchetype"
                    :options="currentArchetypes"
                    group-label="group"
                    group-values="list"
                    label="name"
                    track-by="url"
                >
                    <template #placeholder>
                        --- {{ currentClass?.archetypeName }} ---
                    </template>

                    <template #option="{ option }">
                        <span v-if="option.$isLabel">{{ option.$groupLabel.name }}</span>

                        <span
                            v-else
                            @click.left.exact.prevent="goToArchetype(option.url)"
                        >{{ option.name }}</span>
                    </template>
                </ui-select>
            </div>
        </template>

        <template #default>
            <div
                v-if="currentClass"
                class="class-detail__content"
            >
                <div
                    v-if="currentTab?.type !== 'spells' && currentTab?.type !== 'options'"
                    ref="classBody"
                    class="class-detail__body"
                >
                    <div
                        v-if="currentTab?.url"
                        class="class-detail__body--inner"
                    >
                        <raw-content
                            :url="currentTab.url"
                            @loaded="initScrollListeners"
                            @before-unmount="removeScrollListeners"
                        />
                    </div>
                </div>

                <spells-view
                    v-else-if="currentTab?.type === 'spells'"
                    :filter-url="currentTab.url"
                    :query-books="providedQueryBooks"
                    :store-key="getStoreKey"
                    in-tab
                />

                <options-view
                    v-else-if="currentTab?.type === 'options'"
                    :filter-url="currentTab.url"
                    :query-books="providedQueryBooks"
                    :store-key="getStoreKey"
                    in-tab
                />
            </div>

            <vue-easy-lightbox
                v-if="currentClass?.images?.length"
                :imgs="currentClass?.images"
                :index="gallery.index"
                :visible="gallery.show"
                teleport="body"
                loop
                move-disabled
                scroll-disabled
                @hide="gallery.show = false"
            >
                <template #toolbar/>
            </vue-easy-lightbox>
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import isArray from "lodash/isArray";
    import sortBy from "lodash/sortBy";
    import groupBy from "lodash/groupBy";
    import { resolveUnref } from '@vueuse/core';
    import cloneDeep from 'lodash/cloneDeep';
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiSelect from '@/components/form/UiSelect.vue';
    import SpellsView from "@/views/Character/Spells/SpellsView.vue";
    import errorHandler from "@/common/helpers/errorHandler";
    import OptionsView from "@/views/Character/Options/OptionsView.vue";
    import RawContent from "@/components/content/RawContent.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {

        components: {
            ContentDetail,
            RawContent,
            OptionsView,
            SpellsView,
            UiSelect,
            SvgIcon,
            SectionHeader
        },
        inject: {
            queryBooks: {
                default: undefined
            }
        },
        async beforeRouteUpdate(to, from, next) {
            this.removeScrollListeners();

            await this.classInfoQuery(to.path);

            next();
        },
        beforeRouteLeave(to, from) {
            if (to.name !== 'classes') {
                return;
            }

            this.$emit('scroll-to-last-active', from.path);
        },
        data: () => ({
            loading: true,
            error: false,
            currentClass: undefined,
            currentTab: undefined,
            tabs: [],
            gallery: {
                show: false,
                index: null
            },
            abortController: null
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            providedQueryBooks() {
                return this.queryBooks();
            },

            getStoreKey() {
                return `${ this.currentClass.name.eng + this.currentTab.type + this.currentTab.order }`
                    .replaceAll(' ', '');
            },

            currentSelectArchetype() {
                let selected;

                for (let i = 0; i < this.currentArchetypes.length && !selected; i++) {
                    for (let index = 0; index < this.currentArchetypes[i].list.length && !selected; index++) {
                        if (this.currentArchetypes[i].list[index].url === this.$route.path) {
                            selected = this.currentArchetypes[i].list[index];
                        }
                    }
                }

                return selected;
            },

            currentArchetypes() {
                const getArchetypes = list => sortBy(
                    Object.values(groupBy(list, o => o.type.name))
                        .map(value => ({
                            group: value[0].type,
                            list: value.map(el => ({
                                name: `${ el.name.rus } [${ el.source.shortName }]`,
                                url: el.url
                            }))
                        })),
                    [o => o.group.order]
                );

                return isArray(this.currentClass?.archetypes) && this.currentClass.archetypes.length
                    ? getArchetypes(this.currentClass.archetypes)
                    : [];
            }
        },
        async mounted() {
            await this.classInfoQuery(this.$route.path);

            this.$emit('scroll-to-active');
        },
        beforeUnmount() {
            this.removeScrollListeners();
        },
        methods: {
            async classInfoQuery(url) {
                if (this.abortController) {
                    this.abortController.abort();
                }

                try {
                    this.error = false;
                    this.loading = true;
                    this.abortController = new AbortController();

                    const resp = await this.$http.post({
                        url,
                        payload: {
                            filter: {
                                book: resolveUnref(this.queryBooks)
                            }
                        },
                        signal: this.abortController.signal
                    });

                    const classInfo = this.getUpdatedClass(resp.data);

                    await this.initTabs(classInfo);

                    this.currentClass = classInfo;
                } catch (err) {
                    errorHandler(err);

                    this.error = true;
                } finally {
                    this.loading = false;
                    this.abortController = null;
                }
            },

            getUpdatedClass(classInfo) {
                const updatedClass = cloneDeep(classInfo);

                if (!updatedClass.images || !Array.isArray(updatedClass.images)) {
                    updatedClass.images = [];
                }

                if (!updatedClass.images.length && updatedClass.image) {
                    updatedClass.images.unshift(updatedClass.image);
                }

                return updatedClass;
            },

            async initTabs(loadedClass) {
                this.tabs = sortBy(loadedClass.tabs, ['order']);

                if (isArray(loadedClass.images) && loadedClass.images?.length) {
                    this.tabs.push({
                        type: 'images',
                        order: this.tabs.length,
                        callback: this.showGallery
                    });
                }

                await this.setTab(0);
            },

            setTab(index) {
                try {
                    this.loading = true;

                    this.currentTab = this.tabs[index];
                    this.loading = false;

                    this.$nextTick(() => {
                        if (this.$refs.classBody) {
                            this.$refs.classBody.scroll({
                                top: 0
                            });
                        }
                    });
                } catch (err) {
                    this.loading = false;
                    this.error = true;

                    errorHandler(err);
                }
            },

            async clickTabHandler({
                index, callback
            }) {
                if (typeof callback === 'function') {
                    callback();

                    return;
                }

                await this.setTab(index);
            },

            goToArchetype(path) {
                this.$router.push({ path });
            },

            initScrollListeners() {
                if (this.$route.hash) {
                    const section = this.$refs.classBody.querySelector(this.$route.hash);

                    if (!section) {
                        return;
                    }

                    this.$refs.classBody.scroll({
                        top: section.getBoundingClientRect().top - 119 - 56,
                        behavior: "smooth"
                    });
                }

                const links = this.$refs.classBody.querySelectorAll('[href^="#"]');

                for (const link of links) {
                    link.addEventListener('click', this.scrollToSection);
                }
            },

            removeScrollListeners() {
                if (!this.$refs.classBody) {
                    return;
                }

                const links = this.$refs.classBody.querySelectorAll('[href^="#"]');

                for (const link of links) {
                    link.removeEventListener('click', this.scrollToSection);
                }
            },

            scrollToSection(e) {
                if (e.button) {
                    return;
                }

                e.preventDefault();

                const { target } = e;
                const hash = target.getAttribute('href');

                if (!hash) {
                    return;
                }

                const section = this.$refs.classBody.querySelector(hash);

                if (!section) {
                    return;
                }

                window.history.pushState({ ...window.history.state }, null, hash);

                this.$refs.classBody.scroll({
                    top: section.getBoundingClientRect().top - 119 - 56,
                    behavior: "smooth"
                });
            },

            showGallery() {
                if (!this.currentClass?.images?.length) {
                    return;
                }

                this.gallery.show = true;
                this.gallery.index = 0;
            },

            close() {
                this.$router.push({ name: 'classes' });
            }
        }
    };
</script>

<style lang="scss" scoped>
    .class-detail {
        overflow: hidden;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        &__loader {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            &_img {
                width: 70%;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;

                &:before {
                    content: '';
                    display: block;
                    width: 100%;
                    padding-bottom: 100%;
                }

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    position: absolute;
                    filter: drop-shadow(0 0 12px var(--bg-main));
                }
            }
        }

        &__tabs {
            display: flex;
            width: 100%;
            flex-shrink: 0;
            border: {
                width: 0 0 1px;
                style: solid;
                color: var(--border);
            };
        }

        &__tab {
            @include css_anim();

            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 24px;
            cursor: pointer;
            height: 46px;
            flex: 1 1 100%;
            min-width: fit-content;

            &.is-only-icon {
                flex: 1 0 fit-content;
            }

            & + & {
                border-left: 1px solid var(--border);
            }

            &_icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                color: var(--primary);
            }

            &_name {
                color: var(--text-color);
                margin-left: 16px;
                white-space: nowrap;
                font-size: var(--main-font-size);

                @include media-max(800px) {
                    display: none;
                }

                @include media-max(380px) {
                    margin-left: 8px;
                }
            }

            @include media-min($md) {
                &:hover {
                    background-color: var(--bg-sub-menu);
                }
            }

            &.is-active {
                background-color: var(--primary-active);

                .class-detail__tab {
                    &_icon,
                    &_name {
                        color: var(--text-btn-color);
                    }

                    &_name {
                        display: block;
                    }
                }
            }

            @include media-max(1300px) {
                padding: 0 16px;
            }

            @include media-max(380px) {
                padding: 0 8px;
            }
        }

        &__select {
            ::v-deep(.ui-select) {
                .multiselect {
                    border-width: 0 0 1px 0;
                    border-radius: 0;

                    &__content {
                        &-wrapper {
                            width: 100%;
                            left: 0;
                            border: {
                                radius: 0;
                                width: 0 0 1px 0;
                            }
                        }
                    }

                    &__tags,
                    &__select {
                        border-radius: 0;
                    }

                    &:hover,
                    &:focus-within {
                        @include css_anim();

                        border-color: var(--border);

                        .multiselect {
                            &__content {
                                &-wrapper {
                                    border-color: var(--border);
                                }
                            }
                        }
                    }
                }
            }
        }

        &__content {
            width: 100%;
            flex: 1 1 100%;
            max-height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        &__body {
            width: 100%;
            flex: 1 1 100%;
            overflow: auto;

            &--inner {
                padding: 24px;
            }
        }

        &__images {
            width: 100%;

            &_item {
                width: calc(100% / 3);
            }
        }
    }
</style>
