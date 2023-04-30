<template>
    <page-layout
        :use-social-links="false"
        :show-separator="false"
        class="search-view"
    >
        <template #title>
            Поиск по сайту
        </template>

        <template #default>
            <div class="search-view__wrapper">
                <div
                    ref="controls"
                    class="search-view__controls"
                >
                    <form
                        class="search-view__control"
                        novalidate="novalidate"
                        autocomplete="off"
                        autofocus="autofocus"
                        autocapitalize="off"
                        @submit.prevent.stop="onChangeSearch"
                    >
                        <div class="search-view__control_body">
                            <div
                                class="search-view__control_icon"
                                :class="{ 'in-progress': inProgress }"
                            >
                                <svg-icon
                                    :icon-name="inProgress ? 'dice-d20' : 'search-new'"
                                    :stroke-enable="false"
                                    fill-enable
                                />
                            </div>

                            <ui-input
                                ref="input"
                                v-model="search"
                                placeholder="Поиск..."
                                @update:model-value="onChangeSearch"
                                @keyup.enter.exact.prevent.stop="onChangeSearch"
                            />

                            <ui-erase-button
                                v-if="search"
                                @click="search = ''"
                            />
                        </div>

                        <ui-button class="search-view__control_btn">
                            Поиск
                        </ui-button>
                    </form>
                </div>

                <div
                    v-if="resultsNumbers"
                    class="search-view__count"
                >
                    Результат: {{ resultsNumbers.min }}-{{ resultsNumbers.max }} из {{ results?.count }}
                </div>

                <div class="search-view__results">
                    <search-link
                        v-for="(res, key) in results?.list || []"
                        :key="key"
                        :search-link="res"
                        show-desc
                    />

                    <div
                        v-if="!search.trim() && !results?.list.length"
                        class="search-view__results_text"
                    >
                        Введите текст, что бы начать
                    </div>

                    <div
                        v-else-if="search.trim() && inProgress && !results?.list.length"
                        class="search-view__results_text"
                    >
                        Боги ищут ответ на твой запрос
                    </div>

                    <div
                        v-else-if="!results?.list.length && !inProgress"
                        class="search-view__results_text"
                    >
                        Боги не нашли ответа на твой запрос
                    </div>
                </div>

                <ui-paginate
                    v-if="pages > 1"
                    v-model="page"
                    class="search-view__paginate"
                    :page-count="pages"
                    :click-handler="onPageChanged"
                />
            </div>
        </template>
    </page-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, ref
    } from 'vue';
    import type { LocationQueryValue, RouteLocationNormalized } from 'vue-router';
    import {
        onBeforeRouteUpdate, useRoute, useRouter
    } from 'vue-router';
    import debounce from 'lodash/debounce';
    import { storeToRefs } from 'pinia';
    import {
        onStartTyping, tryOnBeforeMount, useFocus
    } from '@vueuse/core';
    import PageLayout from '@/components/content/PageLayout.vue';
    import type { TSearchResultList } from '@/types/Search/Search.types';
    import { useAxios } from '@/common/composition/useAxios';
    import SearchLink from '@/views/Search/SearchLink.vue';
    import UiPaginate from '@/components/UI/kit/UiPaginate.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useMetrics } from '@/common/composition/useMetrics';
    import UiInput from "@/components/UI/kit/UiInput.vue";
    import UiEraseButton from "@/components/UI/kit/UiEraseButton.vue";

    export default defineComponent({
        components: {
            UiEraseButton,
            UiInput,
            UiButton,
            SvgIcon,
            UiPaginate,
            SearchLink,
            PageLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { bodyElement } = storeToRefs(uiStore);
            const http = useAxios();
            const { sendSearchMetrics, sendSearchViewResultsMetrics } = useMetrics();
            const controller = ref<AbortController | null>(null);
            const inProgress = ref(false);
            const search = ref('');
            const page = ref(1);
            const results = ref<TSearchResultList | null>(null);
            const controls = ref<null | HTMLElement>(null);
            const isNeedUpdateScroll = ref(false);
            const input = ref<null | HTMLElement>(null);
            const { focused } = useFocus(input, { initialValue: true });

            const pages = computed(() => {
                if (!results.value?.count || results.value.count <= 20) {
                    return 0;
                }

                return Math.round(results.value.count / 20);
            });

            const resultsNumbers = ref<null | { min: number, max: number }>(null);

            const onUpdateRoute = async (replace: boolean = false) => {
                const to = {
                    name: 'search-page',
                    query: {
                        search: search.value,
                        page: page.value
                    }
                };

                if (replace) {
                    await router.replace(to);

                    return;
                }

                await router.push(to);
            };

            const resolveQuerySearch = (querySearch?: LocationQueryValue | LocationQueryValue[]) => {
                if (Array.isArray(querySearch)) {
                    search.value = '';

                    return;
                }

                switch (typeof querySearch) {
                    case 'string':
                        search.value = querySearch;

                        break;
                    default:
                        search.value = '';

                        break;
                }
            };

            const resolveQueryPage = (queryPage?: LocationQueryValue | LocationQueryValue[]) => {
                if (!search.value || Array.isArray(queryPage)) {
                    page.value = 1;

                    return;
                }

                switch (typeof queryPage) {
                    case 'string':
                        if (!route.query.page) {
                            page.value = 1;

                            break;
                        }

                        page.value = parseInt(queryPage, 10);

                        break;
                    default:
                        page.value = 1;

                        break;
                }
            };

            const resolveQuery = (to?: RouteLocationNormalized) => {
                resolveQuerySearch(to?.query.search);
                resolveQueryPage(to?.query.page);
            };

            const onChangeSearch = debounce(async () => {
                isNeedUpdateScroll.value = true;

                if (search.value.trim()) {
                    await onUpdateRoute();
                }
            }, 300);

            const onPageChanged = debounce(async () => {
                isNeedUpdateScroll.value = true;

                await onUpdateRoute();
            }, 300);

            const searchQuery = async () => {
                try {
                    if (controller.value !== null) {
                        controller.value.abort();
                    }

                    controller.value = new AbortController();

                    const resp = await http.post({
                        url: '/search',
                        payload: {
                            page: page.value - 1,
                            limit: 20,
                            search: {
                                value: search.value,
                                exact: false
                            },
                            order: []
                        },
                        signal: controller.value.signal
                    });

                    if (resp.status !== 200) {
                        return Promise.reject(resp.statusText);
                    }

                    sendSearchMetrics(search);

                    return Promise.resolve(resp.data as TSearchResultList);
                } catch (err) {
                    return Promise.reject(err);
                } finally {
                    controller.value = null;
                }
            };

            const onSearch = async () => {
                if (!search.value) {
                    return Promise.resolve();
                }

                try {
                    inProgress.value = true;

                    const result = await searchQuery();

                    if (result.count && !result.list.length && page.value !== 1) {
                        page.value = 1;

                        await onUpdateRoute(true);

                        return Promise.resolve();
                    }

                    results.value = result;

                    if (isNeedUpdateScroll.value) {
                        const controlsRect = controls.value?.getBoundingClientRect();

                        if (!uiStore.bodyScroll.y || (controlsRect && controlsRect.top > 0)) {
                            isNeedUpdateScroll.value = false;

                            return Promise.resolve();
                        }

                        bodyElement.value?.scroll({
                            top: 0,
                            behavior: 'smooth'
                        });

                        isNeedUpdateScroll.value = false;
                    }

                    sendSearchViewResultsMetrics(
                        search,
                        result.list.map(item => ({
                            item_id: item.url,
                            item_name: item.name,
                            item_category: item.section,
                            item_brand: item.source?.name
                        }))
                    );

                    return Promise.resolve();
                } catch (err) {
                    return Promise.reject(err);
                } finally {
                    inProgress.value = false;

                    if (results.value?.count) {
                        resultsNumbers.value = {
                            min: page.value > 1
                                ? 20 * (page.value - 1) + 1
                                : 1,
                            max: page.value < pages.value && results.value.count > 20
                                ? 20 * page.value
                                : results.value.count
                        };
                    }

                    if (!results.value?.count) {
                        resultsNumbers.value = null;
                    }
                }
            };

            onStartTyping(() => {
                focused.value = true;
            });

            tryOnBeforeMount(async () => {
                resolveQuery(route);

                await onUpdateRoute(true);

                if (!search.value) {
                    return;
                }

                await onSearch();
            });

            onBeforeRouteUpdate(async (to, from, next) => {
                resolveQuery(to);

                if (search.value) {
                    await onSearch();
                }

                next();
            });

            return {
                controls,
                input,
                search,
                results,
                page,
                pages,
                resultsNumbers,
                inProgress,
                onUpdateRoute,
                onChangeSearch,
                onPageChanged
            };
        }
    });
</script>

<style lang="scss" scoped>
    .search-view {
        &__wrapper {
            display: flex;
            flex-direction: column;
            min-height: 100%;
        }

        &__controls {
            position: sticky;
            top: 0;
            padding: 16px 0;
            margin: -16px 0;
            opacity: 1;
            background-color: var(--bg-main);
            z-index: 10;
        }

        &__control {
            display: flex;

            &_body {
                display: flex;
                background: var(--bg-sub-menu);
                overflow: hidden;
                flex: 1 1 auto;
                border: {
                    width: 1px;
                    style: solid;
                    color: var(--border);
                    radius: 8px 0 0 8px;
                    right-width: 0;
                };
            }

            &_icon {
                padding: 8px;
                flex-shrink: 0;

                svg {
                    width: 24px;
                    height: 24px;
                    color: var(--text-color);
                }

                &.in-progress {
                    svg {
                        @keyframes loader {
                            from {
                                transform: rotate(0deg);
                            }

                            to {
                                transform: rotate(360deg);
                            }
                        }

                        animation: {
                            name: loader;
                            duration: 1.5s;
                            iteration-count: infinite;
                        };
                    }
                }
            }

            &_btn {
                border-radius: 0 8px 8px 0;
                padding: 8px 16px;
            }
        }

        &__count {
            padding: 16px 12px 16px;
        }

        &__results {
            flex: 1 1 auto;

            &_text {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 32px 12px;
                color: var(--text-color);
            }
        }

        &__paginate {
            position: sticky;
            bottom: 0;
            background-color: var(--bg-main);
            padding: 8px 0 24px 0;
            margin: -8px 0 -24px 0;
        }
    }

    .search-link {
        margin-top: 8px;
        border-radius: 4px;
    }

    :deep(.ui-input__control) {
        border: 0;
        .ui-input__input {
            height: 40px;
            padding: 0;
            color: var(--text-b-color);
        }
    }
</style>
