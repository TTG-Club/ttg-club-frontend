<template>
    <vue-final-modal
        v-bind="$attrs"
        v-model="isShowModal"
        content-class="search-modal"
        esc-to-close
        focus-trap
        @opened="focused = true"
    >
        <div class="search-modal__container">
            <div class="search-modal__wrapper">
                <div class="search-modal__control">
                    <div class="search-modal__control_icon">
                        <svg-icon
                            icon-name="search-new"
                            :stroke-enable="false"
                            fill-enable
                        />
                    </div>

                    <form
                        class="search-modal__control_field"
                        novalidate="novalidate"
                        autocomplete="off"
                        autofocus="autofocus"
                        autocapitalize="off"
                        @submit.prevent.stop="navigate"
                    >
                        <input
                            ref="input"
                            v-model="search"
                            @keyup.enter.exact.prevent.stop="navigate"
                        />
                    </form>

                    <div
                        v-if="!inProgress && results?.count"
                        class="search-modal__control__count"
                    >
                        Найдено: {{ results?.count }}
                    </div>

                    <ui-button
                        class="search-modal__control_dice"
                        type-link
                        is-icon
                    >
                        <svg-icon
                            icon-name="dice-flat"
                            :stroke-enable="false"
                            fill-enable
                        />
                    </ui-button>
                </div>

                <div class="search-modal__results">
                    <search-link
                        v-for="(res, key) in results?.list || []"
                        :key="key"
                        :search-link="res"
                    />

                    <div
                        v-if="!search.length && !results?.list.length"
                        class="search-modal__text"
                    >
                        Введите текст, что бы начать
                    </div>

                    <div
                        v-else-if="search.length < 3 && !results?.list.length"
                        class="search-modal__text"
                    >
                        Минимум 3 символа для поиска
                    </div>

                    <div
                        v-else-if="search.length >= 3 && inProgress"
                        class="search-modal__text"
                    >
                        Боги ищут ответ на твой запрос
                    </div>

                    <div
                        v-else-if="!results?.list.length && !inProgress"
                        class="search-modal__text"
                    >
                        Боги не нашли ответа на твой запрос
                    </div>

                    <a
                        class="search-modal__all"
                        @click.left.exact.stop="navigate"
                    >
                        <div class="search-modal__all_icon">
                            <svg-icon
                                icon-name="search-page"
                                :stroke-enable="false"
                                fill-enable
                            />
                        </div>

                        <div class="search-modal__all_body">
                            Открыть страницу поиска
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </vue-final-modal>
</template>

<script lang="ts">
    import {
        defineComponent, onMounted, ref, watch
    } from 'vue';
    import debounce from 'lodash/debounce';
    import {
        useVModel, useFocus, onStartTyping
    } from '@vueuse/core';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useAxios } from '@/common/composition/useAxios';
    import type { TSearchResultList } from '@/types/Search/Search.types';
    import SearchLink from '@/views/Search/SearchLink.vue';

    export default defineComponent({
        components: {
            SearchLink,
            UiButton,
            SvgIcon
        },
        props: {
            modelValue: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const isShowModal = useVModel(props, 'modelValue');
            const http = useAxios();
            const controller = ref<AbortController | null>(null);
            const search = ref('');
            const results = ref<TSearchResultList | null>(null);
            const inProgress = ref(false);
            const input = ref<HTMLElement | null>(null);
            const { focused } = useFocus(input, { initialValue: true });

            const onSearch = async () => {
                results.value = null;
                inProgress.value = true;

                if (controller.value !== null) {
                    controller.value.abort();
                }

                if (!search.value.length || (search.value.length < 3 && search.value.length !== 0)) {
                    return Promise.resolve();
                }

                try {
                    controller.value = new AbortController();

                    const resp = await http.post({
                        url: '/search',
                        payload: {
                            page: 0,
                            limit: 5,
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

                    results.value = resp.data as TSearchResultList;

                    return Promise.resolve();
                } catch (err) {
                    results.value = null;

                    return Promise.reject(err);
                } finally {
                    controller.value = null;
                    inProgress.value = false;
                }
            };

            onStartTyping(() => {
                focused.value = true;
            });

            onMounted(() => {
                focused.value = true;
            });

            const navigate = () => {
                window.location.href = `/search?search=${ search.value }`;
            };

            const onSearchDebounce = debounce(async () => {
                await onSearch();
            }, 300);

            watch(search, () => {
                onSearchDebounce();
            });

            return {
                isShowModal,
                inProgress,
                input,
                search,
                results,
                focused,
                navigate
            };
        }
    });
</script>

<style lang="scss" scoped>
    :deep(.search-modal) {
        pointer-events: none;
    }

    .search-modal {
        &__container {
            height: var(--max-vh);
            padding: 24px 24px 0;
            display: flex;
            flex-direction: column;
            max-width: 560px;
            width: 100vw;
            pointer-events: none;

            @include media-min($md) {
                padding: 56px 24px 0;
            }
        }

        &__wrapper {
            background: var(--bg-secondary);
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 8px 31px 15px var(--bg-light-main);
            width: 100%;
            pointer-events: auto;
        }

        &__control {
            display: flex;

            &_field {
                flex: 1 1 100%;
                height: 36px;
                overflow: hidden;
                appearance: none;
                border: 0;

                input {
                    appearance: none;
                    border: 0;
                    outline: none;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    background: transparent;
                    color: var(--text-b-color);
                }
            }

            &__count {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-color);
                padding: 0 16px;
            }

            &_icon {
                svg {
                    color: var(--text-color);
                }
            }

            &_dice {
                svg {
                    @include css_anim($item: transform);

                    color: var(--text-color-title);
                }

                &:hover {
                    svg {
                        transform: rotate(45deg);
                    }
                }
            }

            &_icon,
            &_dice {
                width: 36px;
                height: 36px;
                padding: 6px;
                flex-shrink: 0;
            }
        }

        &__results {
            user-select: none;
        }

        &__text {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            color: var(--text-color);
        }

        &__all {
            @include css_anim();

            display: flex;
            align-items: center;
            padding: 6px 12px;
            color: var(--text-color-title);
            cursor: pointer;

            &:hover {
                background: var(--hover);
            }

            &_icon {
                width: 28px;
                height: 28px;
                padding: 2px;
            }
        }
    }
</style>
