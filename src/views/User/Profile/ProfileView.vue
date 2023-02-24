<template>
    <page-layout
        :show-separator="false"
        :use-social-links="false"
    >
        <template #title>
            Личный кабинет
        </template>

        <template #default>
            <div class="profile">
                <div class="profile__row">
                    <div class="profile__main-info">
                        <div class="profile__main-info_avatar">
                            <img
                                v-lazy="avatar"
                                alt="Аватар"
                            />
                        </div>

                        <div class="profile__main-info_body">
                            <h3 class="profile__main-info_name">
                                {{ user?.username || 'Имя пользователя не указано' }}
                            </h3>

                            <p class="profile__main-info_mail">
                                {{ user?.email || 'E-mail не указан' }}
                            </p>

                            <p class="profile__main-info_role">
                                {{ roles || 'Нет роли' }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="profile__row">
                    <div class="profile__youtube">
                        <ui-input
                            v-model="currentVideo"
                            label="ID нового видео"
                            :is-error="isError"
                        />

                        <ui-button
                            is-icon
                            :disabled="inProgress"
                        >
                            <svg-icon icon-name="check" />
                        </ui-button>
                    </div>
                </div>

                <div
                    v-if="false"
                    class="profile__row"
                >
                    <a
                        href="#"
                        class="profile__btn"
                    >
                        Добавить существо
                    </a>
                </div>

                <div
                    v-if="false"
                    class="profile__row"
                >
                    <div class="profile__blocks">
                        <div class="profile__block">
                            <h5 class="profile__block_name">
                                Статьи
                            </h5>

                            <div class="profile__block_body">
                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Черновики: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>

                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">На проверке: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>

                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Ожидают модерации: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>
                            </div>

                            <div class="profile__block_footer">
                                <a href="#">Добавить</a>

                                <a href="#">Все мои статьи</a>
                            </div>
                        </div>

                        <div class="profile__block">
                            <h5 class="profile__block_name">
                                Приключения
                            </h5>

                            <div class="profile__block_body">
                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Черновики: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>

                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">На проверке: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>

                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Ожидают модерации: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>
                            </div>

                            <div class="profile__block_footer">
                                <a href="#">Добавить</a>

                                <a href="#">Все мои приключения</a>
                            </div>
                        </div>

                        <div class="profile__block">
                            <h5 class="profile__block_name">
                                Новости
                            </h5>

                            <div class="profile__block_body">
                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Черновики: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>
                            </div>

                            <div class="profile__block_footer">
                                <a href="#">Добавить</a>

                                <a href="#">Все мои новости</a>
                            </div>
                        </div>

                        <div class="profile__block">
                            <h5 class="profile__block_name">
                                Пользователи
                            </h5>

                            <div class="profile__block_body">
                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Всего: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>

                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Писателей: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>

                                <p class="profile__block_item">
                                    <span class="profile__block_item-name">Модераторов: </span>

                                    <span class="profile__block_item-value">
                                        <a href="#">0</a>
                                    </span>
                                </p>
                            </div>

                            <div class="profile__block_footer">
                                <a href="#">Посмотреть всех</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </page-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, ref
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import orderBy from 'lodash/orderBy';
    import upperFirst from 'lodash/upperFirst';
    import { tryOnBeforeMount } from '@vueuse/core';
    import PageLayout from '@/components/content/PageLayout.vue';
    import { useUserStore } from '@/store/UI/UserStore';
    import UiInput from '@/components/UI/kit/UiInput.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useAxios } from '@/common/composition/useAxios';

    export default defineComponent({
        components: {
            SvgIcon,
            UiInput,
            PageLayout,
            UiButton
        },
        setup() {
            const http = useAxios();
            const userStore = useUserStore();
            const currentVideo = ref<string | null>(null);
            const isError = ref(false);
            const inProgress = ref(false);

            const {
                user,
                avatar,
                roles: userRoles
            } = storeToRefs(userStore);

            const roles = computed(() => (
                upperFirst(orderBy(userRoles.value)
                    .map(role => role.name)
                    .join(', '))
            ));

            const getLastVideo = async () => {
                try {
                    const resp = await http.get({ url: '/youtube/last' });

                    if (resp.status !== 200) {
                        return Promise.reject(resp.status);
                    }

                    currentVideo.value = resp.data.id;

                    return Promise.resolve(resp.data);
                } catch (err) {
                    return Promise.reject(err);
                }
            };

            const setNewVideo = async () => {
                inProgress.value = true;
                isError.value = false;

                try {
                    const resp = await http.put({ url: `/youtube/${ currentVideo.value }` });

                    if (resp.status !== 200) {
                        isError.value = true;
                        inProgress.value = false;

                        return Promise.reject(resp.status);
                    }

                    currentVideo.value = resp.data.id;
                    inProgress.value = false;

                    return Promise.resolve(resp.data);
                } catch (err) {
                    inProgress.value = false;

                    return Promise.reject(err);
                }
            };

            tryOnBeforeMount(async () => {
                await getLastVideo();
            });

            return {
                user,
                roles,
                avatar,
                currentVideo,
                isError,
                inProgress,
                setNewVideo
            };
        }
    });
</script>

<style lang="scss" scoped>
    .profile {
        &__row {
            & + & {
                margin-top: 24px;
            }
        }

        &__main-info {
            display: flex;
            align-items: flex-end;

            &_avatar {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 96px;
                height: 96px;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid var(--primary);

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            &_body {
                margin-left: 24px;
            }

            &_name {
                margin: 0;
            }

            &_mail,
            &_role {
                margin: 8px 0 0 0;
            }
        }

        &__youtube {
            display: flex;
            align-items: flex-end;

            .ui-button {
                width: 40px;
                height: 40px;
                margin-left: 8px;
            }
        }

        &__blocks {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }

        &__block {
            background-color: var(--bg-secondary);
            padding: 24px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;

            &_name {
                margin: 0;
                flex-shrink: 0;
                font-size: var(--h4-font-size);
                line-height: var(--h4-line-height);
            }

            &_body {
                flex: 1 1 auto;
                margin-top: 12px;
            }

            &_item {
                margin: 0;

                & + & {
                    margin-top: 8px;
                }
            }

            &_footer {
                flex-shrink: 0;
                display: flex;
                gap: 12px;
                margin-top: 12px;
                border-top: 1px solid var(--border);
                padding-top: 12px;
            }
        }
    }
</style>
