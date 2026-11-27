<script setup lang="ts">
  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useSheetEditGrants,
    useSheetList,
  } from '../composables';
  import {
    getSheetRoute,
    saveSharedSheet,
    SHEET_EDIT_ACCESS_TEXT,
    SHEET_EDIT_ICON,
    SHEET_READONLY_TEXT,
    SHEET_SHARE_ICON,
  } from '../model';

  /**
   * Полоса листа, открытого по ссылке: пометка «Только просмотр» и действия
   * гостя — копия себе, сохранение в «Других листах» и запрос права на
   * правку у владельца. Владельцу — переход к своему листу. Как только
   * владелец разрешил правки, лист открывается на редактирование сам.
   */
  const toast = useToast();
  const { isLoggedIn } = useUser();

  const { sheetId, name, document, sharedToken, sharedInfo, markShared } =
    useCharacterSheet();

  const { copyDocument, isMutating } = useSheetList();

  const {
    getStatus: getEditStatus,
    requestEdit,
    isRequesting,
  } = useSheetEditGrants();

  const isSaving = ref(false);

  const isOwn = computed(() => sharedInfo.value?.own === true);
  const savedId = computed(() => sharedInfo.value?.savedId ?? null);
  const isSaved = computed(() => Boolean(savedId.value));

  const ownRoute = computed(() =>
    sheetId.value ? getSheetRoute(sheetId.value) : undefined,
  );

  const editStatus = computed(() =>
    savedId.value ? getEditStatus(savedId.value) : null,
  );

  const isEditPending = computed(() => editStatus.value === 'PENDING');

  const editRequestLabel = computed(() =>
    isEditPending.value
      ? SHEET_EDIT_ACCESS_TEXT.pending
      : SHEET_EDIT_ACCESS_TEXT.request,
  );

  const editRequestTooltip = computed(() =>
    isEditPending.value
      ? SHEET_EDIT_ACCESS_TEXT.pendingHint
      : SHEET_EDIT_ACCESS_TEXT.requestHint,
  );

  const editRequestIcon = computed(() =>
    isEditPending.value ? SHEET_EDIT_ICON.pending : SHEET_EDIT_ICON.request,
  );

  /** Право на правку выдано: лист открывается как свой, по идентификатору. */
  function openEditable(): void {
    if (sheetId.value) {
      void navigateTo(getSheetRoute(sheetId.value), { replace: true });
    }
  }

  // Промежуточного режима «просмотр с кнопкой правки» нет: право пришло —
  // лист открывается на правку, в том числе пока он открыт по ссылке
  watch(
    () => editStatus.value === 'APPROVED',
    (isApproved) => {
      if (isApproved) {
        openEditable();
      }
    },
    { immediate: true },
  );

  /** Копия листа себе; открывается сразу. Лимит объясняет тост. */
  async function copyToOwn(): Promise<void> {
    const created = await copyDocument(name.value, document.value);

    if (created) {
      await navigateTo(getSheetRoute(created.id));
    }
  }

  /**
   * Сохраняет ссылку в «Других листах».
   * @returns идентификатор записи; null — сохранить не вышло (объяснит тост)
   */
  async function saveLink(): Promise<string | null> {
    const token = sharedToken.value;

    if (!token) {
      return null;
    }

    isSaving.value = true;

    try {
      const saved = await saveSharedSheet(token);

      markShared(saved.id);

      return saved.id;
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_READONLY_TEXT.saveError),
        color: 'error',
      });

      return null;
    } finally {
      isSaving.value = false;
    }
  }

  /** Сохраняет лист в «Других листах». */
  async function saveToOthers(): Promise<void> {
    if (!(await saveLink())) {
      return;
    }

    toast.add({
      title: SHEET_READONLY_TEXT.savedToast,
      description: SHEET_READONLY_TEXT.savedToastDescription(name.value),
      color: 'success',
    });
  }

  /**
   * Просит владельца разрешить правки. Запрос привязан к записи в «Других
   * листах», поэтому несохранённая ссылка сначала сохраняется.
   */
  async function requestEditing(): Promise<void> {
    const targetId = savedId.value ?? (await saveLink());

    if (!targetId) {
      return;
    }

    const status = await requestEdit(targetId);

    // Сводка могла не успеть узнать о праве — открываем лист сами
    if (status === 'APPROVED' && editStatus.value !== 'APPROVED') {
      openEditable();
    }
  }
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <UTooltip :text="SHEET_READONLY_TEXT.tooltip">
      <UBadge
        :label="SHEET_READONLY_TEXT.badge"
        :icon="SHEET_SHARE_ICON.readonly"
        color="neutral"
        variant="subtle"
      />
    </UTooltip>

    <UButton
      v-if="isOwn"
      :label="SHEET_READONLY_TEXT.openOwn"
      :to="ownRoute"
      size="sm"
    />

    <template v-else-if="isLoggedIn">
      <UButton
        :label="SHEET_READONLY_TEXT.copy"
        icon="tabler:copy"
        color="neutral"
        variant="subtle"
        size="sm"
        :loading="isMutating"
        @click.left.exact.prevent="copyToOwn"
      />

      <UButton
        :label="isSaved ? SHEET_READONLY_TEXT.saved : SHEET_READONLY_TEXT.save"
        :icon="isSaved ? SHEET_SHARE_ICON.saved : SHEET_SHARE_ICON.save"
        :color="isSaved ? 'neutral' : 'primary'"
        :variant="isSaved ? 'ghost' : 'solid'"
        size="sm"
        :disabled="isSaved"
        :loading="isSaving"
        @click.left.exact.prevent="saveToOthers"
      />

      <UTooltip :text="editRequestTooltip">
        <UButton
          :label="editRequestLabel"
          :icon="editRequestIcon"
          color="neutral"
          variant="subtle"
          size="sm"
          :disabled="isEditPending"
          :loading="isRequesting"
          @click.left.exact.prevent="requestEditing"
        />
      </UTooltip>
    </template>
  </div>
</template>
