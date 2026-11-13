<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import type { DmScreenSummary } from '../model';

  import { useDmScreen, useDmScreenList } from '../composables';
  import { DmScreenDeleteModal, DmScreenNameModal } from '../dialogs';
  import {
    DM_SCREEN_DEFAULT_NAME,
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    getDmScreenPagePath,
  } from '../model';
  import DmScreenCard from './DmScreenCard.vue';

  /**
   * Ширмы пользователя: список, создание с именем, переименование и
   * удаление. Сколько ширм можно вести, решает сервер; когда лимит
   * исчерпан, создать новую нельзя, пока не удалена одна из старых. Ширма, которую
   * гость собрал в этом браузере до входа, переносится в аккаунт: сама, если
   * ширм ещё нет, или по кнопке.
   */
  const {
    screens,
    used,
    limit,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    rename,
    remove,
  } = useDmScreenList();

  const { localWindows, clearLocal } = useDmScreen();

  const isCreateOpen = ref(false);
  const renaming = ref<DmScreenSummary>();
  const deleting = ref<DmScreenSummary>();

  const isRenameOpen = computed({
    get: () => !!renaming.value,
    set: (open: boolean) => {
      if (!open) {
        renaming.value = undefined;
      }
    },
  });

  const isDeleteOpen = computed({
    get: () => !!deleting.value,
    set: (open: boolean) => {
      if (!open) {
        deleting.value = undefined;
      }
    },
  });

  const counter = computed(() => `${used.value} / ${limit.value}`);

  const hasGuestScreen = computed(() => localWindows.value.length > 0);

  const isEmpty = computed(
    () => isLoaded.value && !errorStatus.value && !screens.value.length,
  );

  const guestActions = computed<Array<ButtonProps>>(() => [
    {
      label: DM_SCREEN_TEXT.guestImport,
      disabled: !canCreate.value || isMutating.value,
      onClick: importGuest,
    },
    {
      label: DM_SCREEN_TEXT.guestDiscard,
      color: 'neutral',
      variant: 'ghost',
      onClick: clearLocal,
    },
  ]);

  const retryActions = computed<Array<ButtonProps>>(() => [
    { label: DM_SCREEN_TEXT.retry, onClick: load },
  ]);

  /**
   * Переносит гостевую ширму в аккаунт новой ширмой.
   * @param name - имя новой ширмы
   */
  async function importGuestScreen(
    name = DM_SCREEN_DEFAULT_NAME,
  ): Promise<void> {
    const created = await create(name, [...localWindows.value]);

    if (created) {
      clearLocal();
    }
  }

  onMounted(async () => {
    await load();

    // Ширм ещё нет: гостевая становится первой без вопросов
    if (
      !errorStatus.value
      && !screens.value.length
      && hasGuestScreen.value
      && canCreate.value
    ) {
      await importGuestScreen();
    }
  });

  function openCreate(): void {
    isCreateOpen.value = true;
  }

  /**
   * Создаёт ширму и открывает её.
   * @param name - имя ширмы
   */
  async function createScreen(name: string): Promise<void> {
    const created = await create(name);

    if (created) {
      await navigateTo(getDmScreenPagePath(created.id));
    }
  }

  /**
   * Открывает переименование ширмы.
   * @param screen - ширма
   */
  function openRename(screen: DmScreenSummary): void {
    renaming.value = screen;
  }

  /**
   * Переименовывает ширму, выбранную для переименования.
   * @param name - новое имя
   */
  async function saveName(name: string): Promise<void> {
    if (renaming.value) {
      await rename(renaming.value.id, name);
    }
  }

  /**
   * Спрашивает, удалить ли ширму.
   * @param screen - ширма
   */
  function openDelete(screen: DmScreenSummary): void {
    deleting.value = screen;
  }

  /** Удаляет ширму, выбранную для удаления. */
  async function confirmDelete(): Promise<void> {
    if (deleting.value) {
      await remove(deleting.value.id);
    }
  }

  function importGuest(): Promise<void> {
    return importGuestScreen();
  }
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
    <header class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl text-highlighted">
        {{ DM_SCREEN_TEXT.screens }}
      </h1>

      <UBadge
        v-if="isLoaded && !errorStatus"
        :label="counter"
        color="neutral"
        variant="soft"
      />

      <UButton
        :icon="DM_SCREEN_ICON.create"
        :label="DM_SCREEN_TEXT.create"
        :disabled="!isLoaded || !canCreate || isMutating"
        class="ml-auto"
        @click.left.exact.prevent="openCreate"
      />
    </header>

    <UAlert
      v-if="isLoaded && !errorStatus && !canCreate"
      :icon="DM_SCREEN_ICON.limit"
      :description="DM_SCREEN_TEXT.limitReached"
      color="neutral"
      variant="subtle"
    />

    <UAlert
      v-if="isLoaded && hasGuestScreen && screens.length"
      :icon="DM_SCREEN_ICON.import"
      :title="DM_SCREEN_TEXT.guestImportTitle"
      :description="DM_SCREEN_TEXT.guestImportDescription"
      color="primary"
      variant="subtle"
      :actions="guestActions"
    />

    <div
      v-if="isLoading && !isLoaded"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-20 w-full"
      />
    </div>

    <UEmpty
      v-else-if="errorStatus !== undefined"
      :icon="DM_SCREEN_ICON.screen"
      :title="DM_SCREEN_TEXT.loadFailed"
      :actions="retryActions"
    />

    <UEmpty
      v-else-if="isEmpty"
      :icon="DM_SCREEN_ICON.screen"
      :title="DM_SCREEN_TEXT.listEmptyTitle"
      :description="DM_SCREEN_TEXT.listEmptyDescription"
    />

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <DmScreenCard
        v-for="screen in screens"
        :key="screen.id"
        :screen="screen"
        :is-busy="isMutating"
        @rename="openRename"
        @delete="openDelete"
      />
    </ul>

    <DmScreenNameModal
      v-model:open="isCreateOpen"
      :title="DM_SCREEN_TEXT.createTitle"
      @save="createScreen"
    />

    <DmScreenNameModal
      v-model:open="isRenameOpen"
      :title="DM_SCREEN_TEXT.renameTitle"
      :name="renaming?.name ?? ''"
      @save="saveName"
    />

    <DmScreenDeleteModal
      v-model:open="isDeleteOpen"
      :name="deleting?.name ?? ''"
      @confirm="confirmDelete"
    />
  </div>
</template>
