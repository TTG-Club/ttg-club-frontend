<template>
    <vue-final-modal
        v-bind="$attrs"
        v-model="isShowModal"
        content-class="search-modal"
        esc-to-close
        focus-trap
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
                        v-if="isShowCounter"
                        class="search-modal__control__count"
                    >
                        Найдено: {{ results.length }}
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
                        v-for="(res, key) in results"
                        :key="key"
                        :href="res[2]"
                        class="search-modal__result"
                    >
                        <div class="search-modal__result_label">
                            {{ res[0] }}
                        </div>

                        <div class="search-modal__result_desc">
                            {{ res[1] }}
                        </div>
                    </a>

                    <div
                        v-if="!search.length"
                        class="search-modal__text"
                    >
                        Введите текст, что бы начать
                    </div>

                    <div
                        v-else-if="!results.length && isShowCounter"
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
    import { debounce } from 'lodash';
    import { useVModel } from '@vueuse/core';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiButton from '@/components/form/UiButton.vue';
    import { useAxios } from '@/common/composition/useAxios';

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
            const results = ref([]);
            const isShowCounter = ref(false);
            const input = ref<HTMLElement | null>(null);

            const onSearch = async () => {
                if (controller.value !== null) {
                    controller.value.abort();
                }

                if (search.value.length < 3 && search.value.length !== 0) {
                    return Promise.resolve();
                }

                if (!search.value.length) {
                    isShowCounter.value = false;
                    results.value = [];

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

                    results.value = resp.data;

                    return Promise.resolve();
                } catch (err) {
                    return Promise.reject(err);
                } finally {
                    controller.value = null;
                    isShowCounter.value = true;
                }
            };

            const onSearchDebounce = debounce(async () => {
                await onSearch();
            }, 300);

            watch(search, () => {
                onSearchDebounce();
            });

            watch(
                isShowModal,
                () => {
                    if (input.value?.focus) {
                        input.value.focus();
                    }
                }
            );

            return {
                isShowModal,
                isShowCounter,
                input,
                search,
                results
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
                    color: var(--text-color-title);
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

            display: block;
            padding: 6px 12px;
            color: var(--text-color-title);

            &:hover {
                background: var(--hover);
            }

            &_desc {
                margin-top: 4px;
                font-style: italic;
                font-size: 13px;
                opacity: .4;
                color: var(--text-color);
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
