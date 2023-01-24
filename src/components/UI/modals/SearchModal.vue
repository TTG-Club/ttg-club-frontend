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

                    <div class="search-modal__control_field">
                        <input
                            ref="input"
                            v-model="search"
                        />
                    </div>

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
                    <a
                        v-for="(res, key) in results?.list || []"
                        :key="key"
                        :href="res.url"
                        class="search-modal__result"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div class="search-modal__result_body">
                            <div class="search-modal__result_label">
                                {{ res.name }}
                            </div>

                            <div class="search-modal__result_desc">
                                {{ res.section }}
                            </div>
                        </div>

                        <div class="search-modal__result_icon">
                            <svg-icon
                                icon-name="new-page"
                                :stroke-enable="false"
                                fill-enable
                            />
                        </div>
                    </a>

                    <div
                        v-if="!search.length"
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
                        href="#"
                        class="search-modal__all"
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
        defineComponent, ref, watch
    } from 'vue';
    import debounce from 'lodash/debounce';
    import { useVModel, useFocus } from '@vueuse/core';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiButton from '@/components/form/UiButton.vue';
    import { useAxios } from '@/common/composition/useAxios';

    type TResult = {
        name: string
        section: string
        url: string
    }

    type TResultList = {
        count: number
        list: TResult[]
    }

    export default defineComponent({
        components: {
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
            const results = ref<TResultList | null>(null);
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

                    results.value = resp.data as TResultList;

                    return Promise.resolve();
                } catch (err) {
                    results.value = null;

                    return Promise.reject(err);
                } finally {
                    controller.value = null;
                    inProgress.value = false;
                }
            };

            const onSearchDebounce = debounce(async () => {
                await onSearch();
            }, 300);

            watch(search, () => {
                onSearchDebounce();
            });

            watch(focused, () => {
                focused.value = true;
            });

            return {
                isShowModal,
                inProgress,
                input,
                search,
                results,
                focused
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

        &__result {
            @include css_anim();

            display: flex;
            align-items: center;
            padding: 6px 12px;
            color: var(--text-color-title);

            &_body {
                flex: 1 1 100%;
            }

            &_desc {
                margin-top: 4px;
                font-style: italic;
                font-size: 13px;
                opacity: .4;
                color: var(--text-color);
            }

            &_icon {
                @include css_anim();

                flex-shrink: 0;
                width: 18px;
                height: 18px;
                opacity: 0;

                svg {
                    color: var(--text-color);
                }
            }

            &:hover {
                background: var(--hover);

                .search-modal__result {
                    &_icon {
                        opacity: 1;
                    }
                }
            }
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
