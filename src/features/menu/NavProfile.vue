<script setup lang="ts">
  import { EUserRoles, useUserStore } from '@/shared/stores/UserStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import AuthModal from '@/shared/ui/modals/AuthModal.vue';

  import ChangePasswordView from '@/features/account/ChangePasswordView.vue';
  import LoginView from '@/features/account/LoginView.vue';
  import RegistrationView from '@/features/account/RegistrationView.vue';
  import NavPopover from '@/features/menu/NavPopover.vue';

  const userStore = useUserStore();

  const { isAuthenticated, user } = storeToRefs(userStore);

  const popover = ref(false);
  const modal = ref('');

  const modals = computed(() => [
    {
      rus: 'Авторизация',
      eng: 'login',
      component: () => LoginView,
    },
    {
      rus: 'Регистрация',
      eng: 'reg',
      component: () => RegistrationView,
    },
    {
      rus: `${isAuthenticated.value ? 'Изменение' : 'Восстановление'} пароля`,
      eng: 'change-password',
      component: () => ChangePasswordView,
    },
  ]);

  const modalInfo = computed(() =>
    modals.value.find((item) => item.eng === modal.value),
  );

  const isModalOpened = computed({
    get: () => !!modal.value,
    set: (e) => {
      modal.value = typeof e === 'string' ? e : '';
    },
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

  const hasAccessToProfile = computed(
    () =>
      user.value?.roles.includes(EUserRoles.MODERATOR) ||
      user.value?.roles.includes(EUserRoles.ADMIN),
  );

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
    if (!(await userStore.getUserStatus())) {
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
</script>

<template>
  <nav-popover v-model="popover">
    <template #trigger="{ isActive }">
      <div
        :class="{ 'is-active': isActive }"
        class="navbar__btn"
        @click.left.exact.prevent="clickHandler"
      >
        <svg-icon
          :icon="`profile/helmet/${isAuthenticated ? 'filled' : 'outline'}`"
        />
      </div>
    </template>

    <template #default>
      <div
        v-if="isAuthenticated"
        class="nav-profile"
      >
        <div class="nav-profile__line is-main">
          <span
            v-if="user"
            class="nav-profile__line_body"
          >
            {{ greeting }}, <b>{{ user.username }}</b>
          </span>

          <span
            v-else
            class="nav-profile__line_body"
          >
            {{ greeting }}
          </span>
        </div>

        <router-link
          v-if="hasAccessToProfile"
          :to="{ path: `/profile` }"
          class="nav-profile__line"
        >
          <span class="nav-profile__line_body"> Личный кабинет </span>
        </router-link>

        <a
          class="nav-profile__line"
          href="#"
          @click.left.exact.prevent="modal = 'change-password'"
        >
          <span class="nav-profile__line_body"> Сменить пароль </span>
        </a>

        <a
          class="nav-profile__line"
          href="#"
          @click.left.exact.prevent="userLogout"
        >
          <span class="nav-profile__line_body"> Выйти </span>

          <span class="nav-profile__line_icon">
            <svg-icon icon="logout" />
          </span>
        </a>
      </div>
    </template>
  </nav-popover>

  <auth-modal
    v-model="isModalOpened"
    :title="modalInfo?.rus"
    @close="closeModal"
  >
    <component
      :is="modalInfo?.component()"
      @close="closeModal"
      @switch:auth="modal = 'login'"
      @switch:reg="modal = 'reg'"
      @switch:change-password="modal = 'change-password'"
    />
  </auth-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .nav-profile {
    width: 100vw;
    max-width: 260px;

    &__line {
      display: flex;
      align-items: center;
      justify-content: flex-start;

      width: 100%;
      padding: 0;

      color: var(--text-b-color);
      text-align: left;

      @include css-anim();

      &.is-main {
        cursor: default;
        background-color: var(--hover);
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

        font-size: 24px;
      }

      &:hover {
        background-color: var(--hover);
      }
    }
  }
</style>
