<template>
    <nav-popover v-model="popover">
        <template #trigger="{ isActive }">
            <div
                :class="{ 'is-active': isActive }"
                class="navbar__btn"
                @click.left.exact.prevent="clickHandler"
            >
                <svg-icon
                    :icon-name="isAuthenticated ? 'profile' : 'profile-outline'"
                    :stroke-enable="false"
                    fill-enable
                />
            </div>
        </template>

        <template #default>
            <div
                v-if="isAuthenticated"
                class="nav-profile"
            >
                <div class="nav-profile__line is-main">
                    <span class="nav-profile__line_body">
                        {{ greeting }}, <b>{{ user.username }}</b>
                    </span>
                </div>

                <a
                    class="nav-profile__line"
                    href="#"
                    @click.left.exact.prevent="openPersonalArea"
                >
                    <span class="nav-profile__line_body">
                        Личный кабинет
                    </span>
                </a>

                <a
                    class="nav-profile__line"
                    href="#"
                    @click.left.exact.prevent="modal = 'change-password'"
                >
                    <span class="nav-profile__line_body">
                        Сменить пароль
                    </span>
                </a>

                <a
                    class="nav-profile__line"
                    href="#"
                    @click.left.exact.prevent="userLogout"
                >
                    <span class="nav-profile__line_body">
                        Выйти
                    </span>

                    <span class="nav-profile__line_icon">
                        <svg-icon
                            :stroke-enable="false"
                            fill-enable
                            icon-name="logout"
                        />
                    </span>
                </a>
            </div>
        </template>
    </nav-popover>

    <auth-modal
        v-if="modalComponent"
        v-model="isModalOpened"
        :title="modalInfo?.rus"
        @close="closeModal"
    >
        <template #default>
            <transition
                mode="out-in"
                name="fade"
            >
                <component
                    :is="modalComponent"
                    @close="closeModal"
                    @switch:auth="modal = 'login'"
                    @switch:reg="modal = 'reg'"
                    @switch:change-password="modal = 'change-password'"
                />
            </transition>
        </template>
    </auth-modal>
</template>

<script>
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import AuthModal from '@/components/UI/modals/AuthModal.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import { useUserStore } from '@/store/UI/UserStore';
    import NavPopover from '@/components/UI/menu/NavPopover.vue';
    import LoginView from '@/components/account/LoginView.vue';
    import RegistrationView from '@/components/account/RegistrationView.vue';
    import ChangePasswordView from '@/components/account/ChangePasswordView.vue';

    export default {
        name: 'NavProfile',
        components: {
            NavPopover,
            AuthModal,
            SvgIcon
        },
        setup() {
            const userStore = useUserStore();
            const { isAuthenticated, user } = storeToRefs(userStore);
            const popover = ref(false);
            const modal = ref('');

            const modals = computed(() => ([
                {
                    rus: 'Авторизация',
                    eng: 'login',
                    component: () => LoginView
                },
                {
                    rus: 'Регистрация',
                    eng: 'reg',
                    component: () => RegistrationView
                },
                {
                    rus: `${ isAuthenticated.value ? 'Изменение' : 'Восстановление' } пароля`,
                    eng: 'change-password',
                    component: () => ChangePasswordView
                }
            ]));

            const modalInfo = computed(() => modals.value.find(item => item.eng === modal.value));
            const modalComponent = computed(() => modalInfo.value?.component());

            const isModalOpened = computed({
                get: () => !!modal.value,
                set: e => {
                    modal.value = typeof e === 'string'
                        ? e
                        : false;
                }
            });

            const greeting = computed(() => {
                const hours = new Date().getHours();

                if (hours < 6) {
                    return 'Доброй ночи';
                }

                if (hours < 12) {
                    return 'Доброе утро';
                }

                if (hours < 18) {
                    return 'Добрый день';
                }

                return 'Добрый вечер';
            });

            function openPopover() {
                popover.value = true;
            }

            function closePopover() {
                popover.value = false;
            }

            function togglePopover() {
                if (!popover.value) {
                    openPopover();

                    return;
                }

                closePopover();
            }

            function openModal(name = 'login') {
                modal.value = name;
            }

            function closeModal() {
                modal.value = '';
            }

            function toggleModal() {
                if (!modal.value) {
                    openModal();

                    return;
                }

                closeModal();
            }

            async function clickHandler() {
                if (!await userStore.getUserStatus()) {
                    toggleModal();

                    return;
                }

                togglePopover();
            }

            async function userLogout() {
                closeModal();
                closePopover();

                await userStore.logout();
            }

            return {
                isAuthenticated,
                isModalOpened,
                greeting,
                user,
                popover,
                userLogout,
                clickHandler,
                closeModal,
                modal,
                modalInfo,
                modalComponent,
                openPersonalArea: () => {
                    window.location.href = '/lk';
                }
            };
        }
    };
</script>

<style lang="scss" scoped>
    .nav-profile {
        width: 100vw;
        max-width: 260px;

        &__line {
            @include css_anim();

            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
            padding: 0;
            color: var(--text-b-color);
            background-color: var(--bg-secondary);

            &.is-main {
                background-color: var(--bg-sub-menu);
                cursor: default;
            }

            &_body {
                flex: 1 1 auto;
                padding: 12px 16px;
            }

            &_icon {
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                padding: 8px;
            }

            &:hover {
                background-color: var(--bg-sub-menu);
            }
        }

        @media (max-width: 600px) {
            max-width: 100%;
        }
    }
</style>
