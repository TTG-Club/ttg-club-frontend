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
                <div class="search-view__filter">
                    <form
                        class="search-view__control"
                        novalidate="novalidate"
                        autocomplete="off"
                        autofocus="autofocus"
                        autocapitalize="off"
                        @submit.prevent.stop="onChangeSearch"
                    >
                        <div class="search-view__control_body">
                            <div class="search-view__control_icon">
                                <svg-icon
                                    icon-name="search-new"
                                    :stroke-enable="false"
                                    fill-enable
                                />
                            </div>

                            <input
                                v-model="search"
                                class="search-view__control_field"
                                @update:model-value="onChangeSearch"
                                @keyup.enter.exact.prevent.stop="onChangeSearch"
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
                    />
                </div>

                <ui-paginate
                    v-if="pages > 1"
                    v-model="page"
                    class="search-view__paginate"
                    :page-count="pages"
                    :click-handler="onChangeSearch"
                />
            </div>
        </template>
    </page-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onMounted, ref
    } from 'vue';
    import type { LocationQueryValue, RouteLocationNormalized } from 'vue-router';
    import {
        onBeforeRouteUpdate, useRoute, useRouter
    } from 'vue-router';
    import debounce from 'lodash/debounce';
    import PageLayout from '@/components/content/PageLayout.vue';
    import type { TSearchResultList } from '@/types/Search/Search.types';
    import { useAxios } from '@/common/composition/useAxios';
    import SearchLink from '@/views/Search/SearchLink.vue';
    import UiPaginate from '@/components/UI/kit/UiPaginate.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';

    export default defineComponent({
        components: {
            UiButton,
            SvgIcon,
            UiPaginate,
            SearchLink,
            PageLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const http = useAxios();
            const controller = ref<AbortController | null>(null);
            const inProgress = ref(false);
            const search = ref('');
            const page = ref(1);
            const results = ref<TSearchResultList | null>(null);
            const wrapper = ref<null | HTMLElement>(null);

            const pages = computed(() => {
                if (!results.value?.count || results.value.count <= 20) {
                    return 0;
                }

                const numberOfPages = Math.round(results.value.count / 20);
                const hasNotFullPage = results.value.count % 20 > 0;

                return hasNotFullPage
                    ? numberOfPages + 1
                    : numberOfPages;
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
                await onUpdateRoute();
            }, 300);

            const searchQuery = async () => {
                try {
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

                    return Promise.resolve(resp.data as TSearchResultList);
                } catch (err) {
                    return Promise.reject(err);
                } finally {
                    controller.value = null;
                }
            };

            const onSearch = async () => {
                inProgress.value = true;

                if (controller.value !== null) {
                    controller.value.abort();
                }

                if (search.value.length < 3) {
                    return Promise.resolve();
                }

                try {
                    const result = await searchQuery();

                    if (result.count && !result.list.length && page.value !== 1) {
                        page.value = 1;

                        await onUpdateRoute(true);

                        return Promise.resolve();
                    }

                    results.value = result;

                    wrapper.value?.scroll({
                        top: 0,
                        behavior: 'smooth'
                    });

                    if (!results.value?.count) {
                        return null;
                    }

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

            onMounted(async () => {
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
                wrapper,
                search,
                results,
                page,
                pages,
                resultsNumbers,
                inProgress,
                onUpdateRoute,
                onChangeSearch
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

            &_field {
                overflow: hidden;
                appearance: none;
                border: 0;
                outline: none;
                flex: 1 1 auto;
                padding: 0;
                text-overflow: ellipsis;
                background: transparent;
                color: var(--text-b-color);
            }

            &_icon {
                padding: 8px;
                flex-shrink: 0;

                svg {
                    width: 24px;
                    height: 24px;
                    color: var(--text-color);
                }
            }

            &_btn {
                border-radius: 0 8px 8px 0;
                padding: 8px 16px;
            }
        }

        &__count {
            padding: 16px 12px 32px;
        }

        &__results {
            flex: 1 1 auto;
        }

        &__paginate {
            margin-top: 16px;
        }
    }

    .search-link {
        margin-top: 8px;
        border-radius: 4px;
    }
</style>
