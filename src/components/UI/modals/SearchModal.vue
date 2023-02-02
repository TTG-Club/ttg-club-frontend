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
                        @submit.prevent.stop="onSubmit"
                    >
                        <input
                            ref="input"
                            v-model="search"
                            @input.prevent.stop="search = $event"
                            @keyup.enter.exact.prevent.stop="onSubmit"
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
                        :selected="selectedIndex === key"
                        disable-hover
                        @mouseenter.self="selectedIndex = key"
                    />

                    <div
                        v-if="!search.length && !results?.list.length"
                        class="search-modal__text"
                        @mouseenter.self="selectedIndex = null"
                    >
                        Введите текст, что бы начать
                    </div>

                    <div
                        v-else-if="search.length < 3 && !results?.list.length"
                        class="search-modal__text"
                        @mouseenter.self="selectedIndex = null"
                    >
                        Минимум 3 символа для поиска
                    </div>

                    <div
                        v-else-if="search.length >= 3 && inProgress"
                        class="search-modal__text"
                        @mouseenter.self="selectedIndex = null"
                    >
                        Боги ищут ответ на твой запрос
                    </div>

                    <div
                        v-else-if="!results?.list.length && !inProgress"
                        class="search-modal__text"
                        @mouseenter.self="selectedIndex = null"
                    >
                        Боги не нашли ответа на твой запрос
                    </div>

                    <a
                        class="search-modal__all"
                        @mouseenter.self="selectedIndex = null"
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
        computed,
        defineComponent, onMounted, ref, watch
    } from 'vue';
    import debounce from 'lodash/debounce';
    import {
        useVModel, useFocus, onStartTyping, onKeyStroke, useActiveElement
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
            const selectedIndex = ref<number | null>(null);
            const activeElement = useActiveElement();

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
                    selectedIndex.value = null;

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
                selectedIndex.value = null;
            });

            onMounted(() => {
                focused.value = true;
            });

            onKeyStroke('ArrowDown', e => {
                if (!isShowModal.value) {
                    return;
                }

                e.preventDefault();

                focused.value = false;

                if (!results.value?.list.length) {
                    return;
                }

                if (selectedIndex.value === null || selectedIndex.value === results.value.list.length - 1) {
                    selectedIndex.value = 0;

                    return;
                }

                selectedIndex.value++;
            });

            onKeyStroke('ArrowUp', e => {
                if (!isShowModal.value) {
                    return;
                }

                e.preventDefault();

                focused.value = false;

                if (!results.value?.list.length) {
                    return;
                }

                if (!selectedIndex.value) {
                    selectedIndex.value = results.value.list.length - 1;

                    return;
                }

                selectedIndex.value--;
            });

            const notUsingInput = computed(() => (
                activeElement.value?.tagName !== 'INPUT'
                && activeElement.value?.tagName !== 'TEXTAREA'
            ));

            onKeyStroke('Enter', e => {
                if (!isShowModal.value) {
                    return;
                }

                e.preventDefault();

                if (!notUsingInput.value) {
                    return;
                }

                if (typeof selectedIndex.value !== 'number' || !results.value?.list.length) {
                    return;
                }

                const result = results.value.list[selectedIndex.value];

                if (!result) {
                    return;
                }

                window.location.href = result.url;
            });

            const navigate = () => {
                window.location.href = `/search?search=${ search.value }`;
            };

            const onSubmit = () => {
                if (!focused.value) {
                    return;
                }

                navigate();
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
                selectedIndex,
                navigate,
                onSubmit
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
            width: 100%;
            pointer-events: auto;
            box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
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
            padding: 8px 0;
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
