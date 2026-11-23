<script setup lang="ts">
  import type { CharacterSheet } from '../model';

  import { SectionLayout } from '~section/layout';
  import { AuthModal } from '~user/auth-modal';

  import { useSheetList } from '../composables';
  import { SheetConfirmModal } from '../dialogs';
  import {
    CHARACTER_SHEET_ICON,
    getSheetRoute,
    SHEET_HTTP_STATUS,
    SHEET_ICON,
    SHEET_IMPORT_ACCEPT,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
    SHEET_TEXT,
  } from '../model';
  import SheetListCard from './SheetListCard.vue';
  import SheetListCreateCard from './SheetListCreateCard.vue';

  /**
   * Страница листов персонажей: у пользователя — его листы, импорт из JSON
   * и слот создания; гостю — приглашение войти. Листы хранятся только в
   * аккаунте.
   */
  const { isLoggedIn, pending } = useUser();

  const {
    sheets,
    limit,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    copy,
    remove,
    importFromFile,
  } = useSheetList();

  const isAuthOpen = ref(false);
  const removedSheet = ref<CharacterSheet | null>(null);
  const isRemoveOpen = ref(false);

  const isAuthError = computed(
    () => errorStatus.value === SHEET_HTTP_STATUS.unauthorized,
  );

  const countLabel = computed(() => `${sheets.value.length} / ${limit.value}`);

  // Счётчик краснеет на достигнутом лимите.
  const countClass = computed(() =>
    canCreate.value ? 'text-muted' : 'text-error',
  );

  // Пока список едет с сервера, лимит неизвестен: импорт упёрся бы в него
  // и соврал про исчерпанный лимит.
  const isImportBusy = computed(() => isLoading.value || isMutating.value);

  // `reset` — чтобы повторный выбор того же файла снова запускал импорт.
  const { open: openFileDialog, onChange: onFilesChange } = useFileDialog({
    accept: SHEET_IMPORT_ACCEPT,
    multiple: false,
    reset: true,
  });

  /**
   * Импортирует выбранный файл; отказы объясняет тостом композабл.
   * @param files - выбор из диалога
   */
  async function importFiles(files: FileList | null): Promise<void> {
    const file = files?.item(0);

    if (!file) {
      return;
    }

    const created = await importFromFile(file);

    if (created) {
      await navigateTo(getSheetRoute(created.id));
    }
  }

  onFilesChange(importFiles);

  /** Открывает выбор JSON-файла; гостю — окно входа. */
  function openImport(): void {
    if (!isLoggedIn.value) {
      openAuth();

      return;
    }

    openFileDialog();
  }

  /** Создаёт пустой лист и открывает его. */
  async function createSheet(): Promise<void> {
    const created = await create();

    if (created) {
      await navigateTo(getSheetRoute(created.id));
    }
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param sheet - удаляемый лист
   */
  function askRemove(sheet: CharacterSheet): void {
    removedSheet.value = sheet;
    isRemoveOpen.value = true;
  }

  async function confirmRemove(): Promise<void> {
    if (removedSheet.value) {
      await remove(removedSheet.value.id);
      removedSheet.value = null;
    }
  }

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // Вошёл через окно входа — показываем его листы. Сессия известна только
  // после загрузки профиля, поэтому ждём её
  watch(
    [isLoggedIn, pending],
    ([loggedIn, isPending]) => {
      if (loggedIn && !isPending) {
        load();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <SectionLayout
    :title="SHEET_TEXT.listTitle"
    is-full-width
  >
    <template #controls>
      <div class="flex flex-col gap-2">
        <UButton
          :icon="SHEET_LIST_ICON.import"
          :label="SHEET_LIST_TEXT.importLabel"
          :loading="isImportBusy"
          block
          @click.left.exact.prevent="openImport"
        />

        <p class="text-xs text-muted">
          {{ SHEET_LIST_TEXT.importHint }}
        </p>
      </div>
    </template>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        :name="SHEET_ICON.loading"
        class="size-6 animate-spin text-muted"
      />
    </div>

    <UEmpty
      v-else-if="!isLoggedIn || isAuthError"
      :icon="CHARACTER_SHEET_ICON"
      :title="SHEET_TEXT.authRequired"
      :description="SHEET_TEXT.authDescription"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.signIn"
          :icon="SHEET_ICON.user"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <section
      v-else
      class="flex flex-col gap-2"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          {{ SHEET_LIST_TEXT.ownTitle }}
        </span>

        <span
          v-if="isLoaded && errorStatus === undefined"
          class="flex items-center gap-1 text-xs tabular-nums"
        >
          <span :class="countClass">{{ countLabel }}</span>

          <UTooltip :text="SHEET_LIST_TEXT.countTooltip">
            <UIcon
              :name="SHEET_LIST_ICON.help"
              class="size-3.5 shrink-0 text-muted"
            />
          </UTooltip>
        </span>
      </div>

      <div
        v-if="isLoading && !isLoaded"
        class="@container"
      >
        <div class="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
          <USkeleton
            v-for="index in 2"
            :key="index"
            class="h-20 w-full rounded-xl"
          />
        </div>
      </div>

      <UEmpty
        v-else-if="errorStatus !== undefined"
        :icon="SHEET_ICON.empty"
        :title="SHEET_TEXT.loadFailed"
        variant="naked"
        class="py-16"
      >
        <template #actions>
          <UButton
            :label="SHEET_TEXT.retry"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="load"
          />
        </template>
      </UEmpty>

      <template v-else>
        <div class="@container">
          <div class="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
            <SheetListCard
              v-for="sheet in sheets"
              :key="sheet.id"
              :sheet="sheet"
              :is-disabled="isMutating"
              :can-copy="canCreate"
              @copy="copy"
              @remove="askRemove"
            />

            <!-- Слот создания исчезает на достигнутом лимите -->
            <SheetListCreateCard
              v-if="canCreate"
              :is-loading="isMutating"
              :is-disabled="isMutating"
              @create="createSheet"
            />
          </div>
        </div>

        <p
          v-if="!canCreate"
          class="text-xs text-muted"
        >
          {{ SHEET_LIST_TEXT.limitReached }}
        </p>
      </template>
    </section>

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="SHEET_TEXT.removeTitle"
      :description="SHEET_TEXT.removeDescription"
      @confirm="confirmRemove"
    />

    <AuthModal v-model="isAuthOpen" />
  </SectionLayout>
</template>
