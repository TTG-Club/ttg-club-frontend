<script setup lang="ts">
  import type { CharacterSheet, SavedSheet } from '../model';

  import { SectionLayout } from '~section/layout';
  import { AuthModal } from '~user/auth-modal';

  import {
    useSavedSheets,
    useSheetEditGrants,
    useSheetEditRequests,
    useSheetList,
  } from '../composables';
  import { SheetConfirmModal, SheetShareModal } from '../dialogs';
  import {
    CHARACTER_SHEET_ICON,
    getSheetLimitTooltip,
    getSheetRoute,
    SAVED_SHEETS_TEXT,
    SHEET_HISTORY_DATE_FORMAT,
    SHEET_HISTORY_ICON,
    SHEET_HISTORY_TEXT,
    SHEET_HTTP_STATUS,
    SHEET_ICON,
    SHEET_IMPORT_ACCEPT,
    SHEET_LIMIT_TEXT,
    SHEET_LIST_ICON,
    SHEET_LIST_TEXT,
    SHEET_TEXT,
  } from '../model';
  import SheetLimitHint from './SheetLimitHint.vue';
  import SheetListCard from './SheetListCard.vue';
  import SheetListCreateCard from './SheetListCreateCard.vue';
  import SheetSavedCard from './SheetSavedCard.vue';

  /**
   * Страница листов персонажей: у пользователя — его листы, импорт из JSON
   * и слот создания; гостю — приглашение войти. Листы хранятся только в
   * аккаунте.
   */
  const { isLoggedIn, pending } = useUser();

  const {
    sheets,
    limit,
    subscriberLimit,
    history,
    historyLimit,
    subscriberHistoryLimit,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    copy,
    copyDocument,
    setShareToken,
    remove,
    restore,
    importFromFile,
  } = useSheetList();

  const toast = useToast();

  const historyDateFormat = new Intl.DateTimeFormat(
    'ru-RU',
    SHEET_HISTORY_DATE_FORMAT,
  );

  const historyTooltip = computed(() =>
    getSheetLimitTooltip(
      SHEET_HISTORY_TEXT.tooltip(historyLimit.value),
      historyLimit.value,
      subscriberHistoryLimit.value,
    ),
  );

  /**
   * Подпись даты удаления.
   * @param deletedAt - дата в ISO-8601
   */
  function getDeletedLabel(deletedAt: string | null): string {
    return deletedAt
      ? SHEET_HISTORY_TEXT.deletedAt(
          historyDateFormat.format(new Date(deletedAt)),
        )
      : '';
  }

  /**
   * Восстанавливает лист из истории и сообщает об этом.
   * @param id - идентификатор листа
   */
  async function restoreSheet(id: string): Promise<void> {
    const restored = await restore(id);

    if (restored) {
      toast.add({
        title: SHEET_HISTORY_TEXT.restored,
        description: restored.name,
        color: 'success',
      });
    }
  }

  const saved = useSavedSheets();

  const {
    items: savedSheets,
    limit: savedLimit,
    subscriberLimit: savedSubscriberLimit,
    isLoading: isSavedLoading,
    isLoaded: isSavedLoaded,
    isError: isSavedError,
  } = saved;

  // Права на правку чужих листов опрашиваются фоном, пока есть запрос без
  // ответа. Ответ владельца меняет карточку (пометка и куда она ведёт),
  // поэтому раздел перечитывается, как только сводка с ним разошлась. Цикла
  // нет: загрузка раздела сводку не трогает, а наблюдатель срабатывает лишь
  // на смену расхождения
  const { getStatus: getEditStatus, requestEdit } = useSheetEditGrants();

  const isSavedEditOutdated = computed(() =>
    savedSheets.value.some(
      (item) => item.editStatus !== getEditStatus(item.id),
    ),
  );

  watch(isSavedEditOutdated, (isOutdated) => {
    if (isOutdated && isSavedLoaded.value && !isSavedLoading.value) {
      void saved.load();
    }
  });

  // Метки запросов на карточках должны совпадать со сводкой входящих
  // запросов: она опрашивается фоном и меняется, когда приходит запрос.
  // Список перечитывается только при расхождении — после загрузки они равны,
  // и наблюдатель затихает
  const { count: incomingEditRequests } = useSheetEditRequests();

  const listedEditRequests = computed(() =>
    sheets.value.reduce((total, sheet) => total + sheet.pendingEditRequests, 0),
  );

  watch(incomingEditRequests, (count) => {
    if (
      count !== listedEditRequests.value
      && isLoaded.value
      && !isLoading.value
    ) {
      void load();
    }
  });

  /**
   * Просит владельца разрешить правки сохранённого листа.
   * @param item - сохранённый лист
   */
  async function requestSavedEdit(item: SavedSheet): Promise<void> {
    if (await requestEdit(item.id)) {
      await saved.load();
    }
  }

  /** Лист, для которого открыто окно «Поделиться». */
  const sharedSheet = ref<CharacterSheet | null>(null);
  const isShareOpen = ref(false);

  const removedSaved = ref<SavedSheet | null>(null);
  const isSavedRemoveOpen = ref(false);

  const isAuthOpen = ref(false);
  const removedSheet = ref<CharacterSheet | null>(null);
  const isRemoveOpen = ref(false);

  const isAuthError = computed(
    () => errorStatus.value === SHEET_HTTP_STATUS.unauthorized,
  );

  const countLabel = computed(() => `${sheets.value.length} / ${limit.value}`);

  const countTooltip = computed(() =>
    getSheetLimitTooltip(
      SHEET_LIMIT_TEXT.sheets(sheets.value.length, limit.value),
      limit.value,
      subscriberLimit.value,
    ),
  );

  const sheetsUpsell = computed(() =>
    subscriberLimit.value > limit.value
      ? SHEET_LIMIT_TEXT.upsellSheets(subscriberLimit.value)
      : undefined,
  );

  const savedCountLabel = computed(
    () => `${savedSheets.value.length} / ${savedLimit.value}`,
  );

  const isSavedFull = computed(
    () => savedSheets.value.length >= savedLimit.value,
  );

  const savedCountTooltip = computed(() =>
    getSheetLimitTooltip(
      SHEET_LIMIT_TEXT.saved(savedSheets.value.length, savedLimit.value),
      savedLimit.value,
      savedSubscriberLimit.value,
    ),
  );

  const savedUpsell = computed(() =>
    savedSubscriberLimit.value > savedLimit.value
      ? SHEET_LIMIT_TEXT.upsellSaved(savedSubscriberLimit.value)
      : undefined,
  );

  /**
   * Открывает окно «Поделиться листом».
   * @param sheet - лист
   */
  function openShare(sheet: CharacterSheet): void {
    sharedSheet.value = sheet;
    isShareOpen.value = true;
  }

  /**
   * Новая ссылка из окна «Поделиться» — в карточку.
   * @param shareToken - секрет ссылки; null — доступ выключен
   */
  function updateShareToken(shareToken: string | null): void {
    if (sharedSheet.value) {
      setShareToken(sharedSheet.value.id, shareToken);
      sharedSheet.value = { ...sharedSheet.value, shareToken };
    }
  }

  /**
   * Копия чужого листа себе; открывается сразу.
   * @param item - сохранённый лист
   */
  async function copySaved(item: SavedSheet): Promise<void> {
    if (!item.data) {
      return;
    }

    const created = await copyDocument(item.name, item.data);

    if (created) {
      await navigateTo(getSheetRoute(created.id));
    }
  }

  /**
   * Спрашивает, убрать ли лист из сохранённых.
   * @param item - сохранённый лист
   */
  function askRemoveSaved(item: SavedSheet): void {
    removedSaved.value = item;
    isSavedRemoveOpen.value = true;
  }

  async function confirmRemoveSaved(): Promise<void> {
    if (removedSaved.value) {
      await saved.remove(removedSaved.value.id);
      removedSaved.value = null;
    }
  }

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
        saved.load();
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

          <UTooltip :text="countTooltip">
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
              @share="openShare"
              @share-enabled="setShareToken"
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

        <SheetLimitHint
          v-if="!canCreate"
          :hint="SHEET_LIST_TEXT.limitReached"
          :upsell="sheetsUpsell"
        />
      </template>
    </section>

    <section
      v-if="isLoggedIn && !isAuthError && history.length"
      class="mt-6 flex flex-col gap-2"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          {{ SHEET_HISTORY_TEXT.title }}
        </span>

        <UTooltip :text="historyTooltip">
          <UIcon
            :name="SHEET_LIST_ICON.help"
            class="size-3.5 shrink-0 text-muted"
          />
        </UTooltip>
      </div>

      <ul
        class="flex flex-col divide-y divide-default rounded-xl border border-default"
      >
        <li
          v-for="item in history"
          :key="item.id"
          class="flex items-center gap-3 px-3 py-2"
        >
          <UIcon
            :name="SHEET_HISTORY_ICON.item"
            class="size-5 shrink-0 text-muted"
          />

          <div class="flex min-w-0 grow flex-col">
            <span class="truncate text-sm font-medium text-highlighted">
              {{ item.name }}
            </span>

            <span class="text-xs text-muted">
              {{ getDeletedLabel(item.deletedAt) }}
            </span>
          </div>

          <UTooltip
            :text="
              canCreate
                ? SHEET_HISTORY_TEXT.restoreAria
                : SHEET_HISTORY_TEXT.restoreLimit
            "
          >
            <UButton
              :label="SHEET_HISTORY_TEXT.restore"
              :icon="SHEET_HISTORY_ICON.restore"
              color="neutral"
              variant="subtle"
              size="sm"
              :disabled="!canCreate || isMutating"
              @click.left.exact.prevent="restoreSheet(item.id)"
            />
          </UTooltip>
        </li>
      </ul>
    </section>

    <section
      v-if="isLoggedIn && !isAuthError && isSavedLoaded"
      class="mt-6 flex flex-col gap-2"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          {{ SAVED_SHEETS_TEXT.title }}
        </span>

        <span
          v-if="!isSavedError"
          class="flex items-center gap-1 text-xs tabular-nums"
        >
          <span :class="isSavedFull ? 'text-error' : 'text-muted'">
            {{ savedCountLabel }}
          </span>

          <UTooltip :text="savedCountTooltip">
            <UIcon
              :name="SHEET_LIST_ICON.help"
              class="size-3.5 shrink-0 text-muted"
            />
          </UTooltip>
        </span>
      </div>

      <UEmpty
        v-if="isSavedError"
        :icon="SHEET_ICON.empty"
        :title="SAVED_SHEETS_TEXT.loadError"
        variant="naked"
        class="py-8"
      >
        <template #actions>
          <UButton
            :label="SHEET_TEXT.retry"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="saved.load()"
          />
        </template>
      </UEmpty>

      <p
        v-else-if="!savedSheets.length"
        class="text-sm text-muted"
      >
        {{ SAVED_SHEETS_TEXT.empty }}
      </p>

      <template v-else>
        <div class="@container">
          <div class="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
            <SheetSavedCard
              v-for="item in savedSheets"
              :key="item.id"
              :saved="item"
              :is-disabled="isMutating"
              :can-copy="canCreate"
              @copy="copySaved"
              @remove="askRemoveSaved"
              @request-edit="requestSavedEdit"
            />
          </div>
        </div>

        <SheetLimitHint
          v-if="isSavedFull"
          :hint="SAVED_SHEETS_TEXT.limitReached"
          :upsell="savedUpsell"
        />
      </template>
    </section>

    <SheetShareModal
      v-if="sharedSheet"
      v-model:open="isShareOpen"
      :sheet-id="sharedSheet.id"
      :share-token="sharedSheet.shareToken"
      @update:share-token="updateShareToken"
    />

    <SheetConfirmModal
      v-model:open="isSavedRemoveOpen"
      :title="SAVED_SHEETS_TEXT.removeTitle"
      :description="SAVED_SHEETS_TEXT.removeDescription"
      @confirm="confirmRemoveSaved"
    />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="SHEET_TEXT.removeTitle"
      :description="SHEET_TEXT.removeDescription"
      @confirm="confirmRemove"
    />

    <AuthModal v-model="isAuthOpen" />
  </SectionLayout>
</template>
