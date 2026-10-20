<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import Cookies from 'js-cookie';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/shared/config';
  import { useUserStore } from '@/shared/stores/UserStore';
  import AuthModal from '@/shared/ui/modals/AuthModal.vue';

  import LoginView from '@/features/account/LoginView.vue';
  import {
    useInitiativeStorage,
    useTrackerList,
  } from '@/features/initiative/composables';
  import {
    createTracker,
    getFetchStatus,
    getTrackerErrorMessage,
    INITIATIVE_TOOL_ROUTE,
    MAX_AUTHORIZED_TRACKERS,
  } from '@/features/initiative/model';

  import { TrackerCreateCard, TrackerListItem } from './ui';

  const router = useRouter();
  const toast = useToast(ToastEventBus);
  const userStore = useUserStore();
  const { isAuthenticated } = storeToRefs(userStore);

  // Токен-кука — синхронный сигнал авторизации на старте (стор с /user/info
  // резолвится асинхронно), плюс реактивный флаг стора после входа.
  const hasTokenCookie = Boolean(Cookies.get('ttg-user-token'));
  const isAuthorized = computed(() => isAuthenticated.value || hasTokenCookie);

  const { slot, saveSlot } = useInitiativeStorage();

  const {
    activeTrackers,
    deletedTrackers,
    canCreate,
    isLoading,
    isMutating,
    loadError,
    load,
    create,
    rename,
    remove,
  } = useTrackerList();

  const isCreatingAnon = ref(false);
  // Авто-создание анонимного боя упало — показываем ручную форму-фолбэк.
  const autoCreateFailed = ref(false);
  const showHistory = ref(false);

  const isAuthOpen = ref(false);

  const isListAuthError = computed(
    () => getFetchStatus(loadError.value) === 401,
  );

  const listErrorResultStatus = computed<'info' | 'error'>(() =>
    isListAuthError.value ? 'info' : 'error',
  );

  const listErrorTitle = computed(() =>
    isListAuthError.value
      ? 'Требуется авторизация'
      : 'Не удалось загрузить трекеры',
  );

  const listErrorSubTitle = computed(() =>
    isListAuthError.value
      ? 'Войдите, чтобы увидеть свои трекеры'
      : getTrackerErrorMessage(loadError.value),
  );

  const countTooltip = computed(
    () =>
      `Активных боёв — ${activeTrackers.value.length} из ${MAX_AUTHORIZED_TRACKERS} возможных`,
  );

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // После закрытия окна входа перезагружаем список: при успешном логине кука
  // обновилась, и серверный прокси подставит новый токен.
  watch(isAuthOpen, (open) => {
    if (!open) {
      load();
    }
  });

  // Анонимный поток: если слот уже занят — уводим на его единственный трекер;
  // если боя ещё нет — сразу создаём трекер и открываем сборку энкаунтера
  // (аноним никогда не видит список). Авторизованному — грузим список.
  onMounted(() => {
    if (isAuthorized.value) {
      load();

      return;
    }

    if (slot.value) {
      router.replace(`${INITIATIVE_TOOL_ROUTE}/${slot.value.trackerId}`);

      return;
    }

    openAnonTracker('', true);
  });

  function openTracker(id: string): void {
    router.push(`${INITIATIVE_TOOL_ROUTE}/${id}`);
  }

  async function handleAuthorizedCreate(name: string): Promise<void> {
    const created = await create(name || undefined);

    if (created) {
      router.push(`${INITIATIVE_TOOL_ROUTE}/${created.id}`);
    }
  }

  /**
   * Создаёт анонимный бой и открывает сборку. При старте страницы вызывается
   * автоматически (`replace`); при ручном фолбэке после ошибки — из формы.
   * @param name Имя боя (может быть пустым — бэк подставит дефолт).
   * @param replace Заменять ли текущую запись истории (авто-открытие на старте).
   */
  async function openAnonTracker(
    name: string,
    replace: boolean,
  ): Promise<void> {
    isCreatingAnon.value = true;
    autoCreateFailed.value = false;

    try {
      const created = await createTracker(name || undefined);

      if (!created.accessKey) {
        toast.error(
          'Не удалось создать трекер. Сервер не вернул ключ доступа.',
        );

        autoCreateFailed.value = true;

        return;
      }

      saveSlot(created.id, created.accessKey);

      const target = `${INITIATIVE_TOOL_ROUTE}/${created.id}`;

      await (replace ? router.replace(target) : router.push(target));
    } catch (error) {
      toast.error(
        `Не удалось создать трекер. ${getTrackerErrorMessage(error)}`,
      );

      autoCreateFailed.value = true;
    } finally {
      isCreatingAnon.value = false;
    }
  }

  function handleCreate(name: string): void {
    if (isAuthorized.value) {
      handleAuthorizedCreate(name);
    } else {
      openAnonTracker(name, false);
    }
  }
</script>

<template>
  <div class="tracker-list">
    <!-- Анонимный пользователь: сразу открываем/создаём бой, без списка -->
    <template v-if="!isAuthorized">
      <!-- Идёт редирект в свой бой или авто-создание нового -->
      <div
        v-if="!autoCreateFailed"
        class="tracker-list__loader"
      >
        <icon
          icon="tabler:loader-2"
          class="tracker-list__spinner"
        />

        <p class="tracker-list__loader-text">
          {{ slot ? 'Открываем ваш трекер…' : 'Готовим новый бой…' }}
        </p>
      </div>

      <!-- Авто-создание упало — ручной фолбэк -->
      <tracker-create-card
        v-else
        heading="Не удалось начать бой"
        description="Попробуйте ещё раз — создадим трекер и откроем сборку энкаунтера."
        submit-label="Собрать бой"
        hide-name
        :loading="isCreatingAnon"
        @create="handleCreate"
      >
        <template #footer>
          <p class="tracker-list__hint">
            Без регистрации — доступен один активный бой.
          </p>
        </template>
      </tracker-create-card>
    </template>

    <!-- Авторизованный пользователь -->
    <template v-else>
      <!-- Герой: создание нового боя — не ждёт загрузки списка -->
      <tracker-create-card
        heading="Собрать бой"
        description="Соберите игроков и существ, прокиньте инициативу — и ведите бой по ходам."
        submit-label="Собрать бой"
        hide-name
        :loading="isMutating"
        :disabled="!canCreate"
        @create="handleCreate"
      >
        <template #footer>
          <p
            v-if="!canCreate"
            class="tracker-list__limit"
          >
            Достигнут лимит {{ MAX_AUTHORIZED_TRACKERS }} трекеров — удалите
            один, чтобы собрать новый.
          </p>
        </template>
      </tracker-create-card>

      <!-- Второй план: список трекеров (тихий, приглушённый) -->
      <div
        v-if="isLoading"
        class="tracker-list__section"
      >
        <span class="tracker-list__section-title">Ваши бои</span>

        <n-skeleton
          v-for="index in 3"
          :key="index"
          :height="48"
          :sharp="false"
        />
      </div>

      <n-result
        v-else-if="loadError"
        :status="listErrorResultStatus"
        :title="listErrorTitle"
        :description="listErrorSubTitle"
      >
        <template #footer>
          <div class="tracker-list__error-actions">
            <n-button
              v-if="isListAuthError"
              type="primary"
              @click="openAuth"
            >
              <template #icon>
                <icon icon="tabler:user" />
              </template>
              Войти
            </n-button>

            <n-button
              :type="isListAuthError ? 'default' : 'primary'"
              :secondary="isListAuthError"
              @click="load"
            >
              Обновить
            </n-button>
          </div>
        </template>
      </n-result>

      <template v-else>
        <section
          v-if="activeTrackers.length"
          class="tracker-list__section"
        >
          <div class="tracker-list__section-head">
            <span class="tracker-list__section-title">Ваши бои</span>

            <span class="tracker-list__count">
              <span :class="{ 'tracker-list__count--limit': !canCreate }">
                {{ activeTrackers.length }} / {{ MAX_AUTHORIZED_TRACKERS }}
              </span>

              <n-tooltip trigger="hover">
                <template #trigger>
                  <icon
                    icon="tabler:help-circle-filled"
                    class="tracker-list__count-icon"
                  />
                </template>

                {{ countTooltip }}
              </n-tooltip>
            </span>
          </div>

          <div class="tracker-list__items">
            <tracker-list-item
              v-for="tracker in activeTrackers"
              :key="tracker.id"
              :tracker="tracker"
              :disabled="isMutating"
              @open="openTracker"
              @rename="rename"
              @remove="remove"
            />
          </div>
        </section>

        <p
          v-else
          class="tracker-list__empty"
        >
          Здесь появятся собранные бои.
        </p>

        <!-- История боёв — свёрнута, во втором плане -->
        <div
          v-if="deletedTrackers.length"
          class="tracker-list__history"
        >
          <n-button
            quaternary
            block
            class="tracker-list__history-toggle"
            @click="showHistory = !showHistory"
          >
            <template #icon>
              <icon icon="tabler:history" />
            </template>

            <span class="tracker-list__history-label">
              История боёв ({{ deletedTrackers.length }})

              <n-tooltip trigger="hover">
                <template #trigger>
                  <icon icon="tabler:help-circle-filled" />
                </template>

                Удалённые бои — доступны только для просмотра, без
                редактирования
              </n-tooltip>
            </span>

            <template #suffix>
              <icon
                :icon="
                  showHistory ? 'tabler:chevron-up' : 'tabler:chevron-down'
                "
              />
            </template>
          </n-button>

          <div
            v-if="showHistory"
            class="tracker-list__items tracker-list__items--history"
          >
            <tracker-list-item
              v-for="tracker in deletedTrackers"
              :key="tracker.id"
              :tracker="tracker"
              readonly
            />
          </div>
        </div>
      </template>
    </template>

    <auth-modal
      v-model="isAuthOpen"
      title="Авторизация"
      @close="isAuthOpen = false"
    >
      <login-view @close="isAuthOpen = false" />
    </auth-modal>
  </div>
</template>

<style scoped lang="scss">
  .tracker-list {
    display: flex;
    flex-direction: column;
    gap: 24px;

    &__loader {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;

      padding-block: 64px;
    }

    &__spinner {
      width: 32px;
      height: 32px;
      color: var(--text-g-color);
      animation: tracker-list-spin 1s linear infinite;
    }

    &__loader-text {
      margin: 0;
      font-size: 14px;
      color: var(--text-g-color);
    }

    &__hint {
      margin: 0;
      font-size: 12px;
      color: var(--text-g-color);
    }

    &__limit {
      margin: 0;
      font-size: 12px;
      color: var(--error);
    }

    &__section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    &__section-head {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    &__section-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-g-color);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    &__count {
      display: flex;
      gap: 4px;
      align-items: center;

      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: var(--text-g-color);

      &--limit {
        color: var(--error);
      }
    }

    &__count-icon {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
      color: var(--text-g-color);
    }

    &__items {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &--history {
        padding-top: 8px;
      }
    }

    &__empty {
      margin: 0;
      font-size: 14px;
      color: var(--text-g-color);
    }

    &__error-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    &__history-toggle {
      justify-content: space-between;
      color: var(--text-g-color);
    }

    &__history-label {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  @keyframes tracker-list-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
