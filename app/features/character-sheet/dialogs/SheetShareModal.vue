<script setup lang="ts">
  import { getApiErrorMessage } from '~user/model';

  import { useSheetEditors } from '../composables';
  import {
    getSheetShareUrl,
    shareSheet,
    SHEET_EDITORS_TEXT,
    SHEET_SHARE_ICON,
    SHEET_SHARE_TEXT,
    unshareSheet,
  } from '../model';
  import SheetEditorRow from './SheetEditorRow.vue';

  /**
   * Доступ к листу по ссылке: включение, копирование и отзыв. Ссылка одна на
   * лист; отзыв гасит её навсегда, повторное включение выдаёт новую. Рядом со
   * ссылкой — запросы на редактирование и выданные права: просить правки
   * могут только те, кто пришёл по ссылке, поэтому без неё список не нужен.
   */
  const { sheetId } = defineProps<{
    sheetId: string;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  /** Секрет ссылки; null — доступ выключен. */
  const shareToken = defineModel<string | null>('shareToken', {
    default: null,
  });

  const toast = useToast();
  const requestUrl = useRequestURL();
  const { copy, isSupported: isCopySupported } = useClipboard();
  const { share, isSupported: isShareSupported } = useShare();

  const isBusy = ref(false);

  const shareUrl = computed(() =>
    shareToken.value
      ? getSheetShareUrl(requestUrl.origin, shareToken.value)
      : '',
  );

  const {
    isPending: isEditorsPending,
    getPendingRequests,
    getApprovedEditors,
    canApproveMore,
    forget: forgetEditors,
    load: loadEditors,
    approve,
    remove,
  } = useSheetEditors();

  const editorRows = computed(() => [
    ...getPendingRequests(sheetId),
    ...getApprovedEditors(sheetId),
  ]);

  const hasApprovedEditors = computed(
    () => getApprovedEditors(sheetId).length > 0,
  );

  const canApproveEditor = computed(() => canApproveMore(sheetId));

  // Список перечитывается при каждом открытии окна и включении ссылки: отзыв
  // ссылки снимает права на сервере, и прежний список был бы уже неправдой
  watch(
    [isOpen, shareToken],
    ([open, token]) => {
      if (open && token) {
        void loadEditors(sheetId);
      }
    },
    { immediate: true },
  );

  /**
   * Разрешает правки по запросу; ошибку показывает тостом композабл.
   * @param editorId - идентификатор запроса
   */
  function approveEditor(editorId: string): void {
    void approve(sheetId, editorId);
  }

  /**
   * Отклоняет запрос или отзывает право; ошибку показывает тостом композабл.
   * @param editorId - идентификатор запроса или права
   */
  function removeEditor(editorId: string): void {
    void remove(sheetId, editorId);
  }

  /**
   * Включает или выключает доступ.
   * @param action - запрос к серверу
   */
  async function run(action: () => Promise<void>): Promise<void> {
    isBusy.value = true;

    try {
      await action();
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_SHARE_TEXT.error),
        color: 'error',
      });
    } finally {
      isBusy.value = false;
    }
  }

  function enable(): Promise<void> {
    return run(async () => {
      shareToken.value = await shareSheet(sheetId);
    });
  }

  function disable(): Promise<void> {
    return run(async () => {
      await unshareSheet(sheetId);
      shareToken.value = null;
      forgetEditors(sheetId);

      toast.add({
        title: SHEET_SHARE_TEXT.disabled,
        description: SHEET_SHARE_TEXT.disabledDescription,
        color: 'success',
      });
    });
  }

  async function copyLink(): Promise<void> {
    await copy(shareUrl.value);
    toast.add({ title: SHEET_SHARE_TEXT.copied, color: 'success' });
  }

  function shareLink(): void {
    void share({ title: SHEET_SHARE_TEXT.title, url: shareUrl.value });
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_SHARE_TEXT.title"
    :ui="{ body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <template v-if="shareToken">
        <UFormField :label="SHEET_SHARE_TEXT.link">
          <div class="flex gap-2">
            <UInput
              :model-value="shareUrl"
              readonly
              class="grow"
              :icon="SHEET_SHARE_ICON.link"
              @focus="($event.target as HTMLInputElement).select()"
            />

            <UTooltip
              v-if="isCopySupported"
              :text="SHEET_SHARE_TEXT.copy"
            >
              <UButton
                :icon="SHEET_SHARE_ICON.copy"
                color="neutral"
                variant="subtle"
                square
                :aria-label="SHEET_SHARE_TEXT.copy"
                @click.left.exact.prevent="copyLink"
              />
            </UTooltip>

            <UTooltip
              v-if="isShareSupported"
              :text="SHEET_SHARE_TEXT.share"
            >
              <UButton
                :icon="SHEET_SHARE_ICON.share"
                color="neutral"
                variant="subtle"
                square
                :aria-label="SHEET_SHARE_TEXT.share"
                @click.left.exact.prevent="shareLink"
              />
            </UTooltip>
          </div>
        </UFormField>

        <UAlert
          :icon="SHEET_SHARE_ICON.readonly"
          color="neutral"
          variant="subtle"
          :title="SHEET_SHARE_TEXT.guestTitle"
          :description="SHEET_SHARE_TEXT.guestDescription"
        />

        <p class="text-sm text-muted">
          {{ SHEET_SHARE_TEXT.hintOn }}
        </p>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted">
              {{ SHEET_EDITORS_TEXT.editorsTitle }}
            </span>

            <span class="text-xs text-muted">
              {{ SHEET_EDITORS_TEXT.editorsHint }}
            </span>
          </div>

          <SheetEditorRow
            v-for="editorRow in editorRows"
            :key="editorRow.id"
            :editor="editorRow"
            :can-approve="canApproveEditor"
            :disabled="isEditorsPending"
            @approve="approveEditor"
            @remove="removeEditor"
          />

          <span
            v-if="!editorRows.length"
            class="text-sm text-toned"
          >
            {{ SHEET_EDITORS_TEXT.editorsEmpty }}
          </span>

          <span
            v-if="hasApprovedEditors"
            class="text-xs text-muted"
          >
            {{ SHEET_EDITORS_TEXT.revokeOnDisableHint }}
          </span>
        </div>
      </template>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ SHEET_SHARE_TEXT.hintOff }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-between gap-2">
        <UButton
          :label="SHEET_SHARE_TEXT.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="isOpen = false"
        />

        <UButton
          v-if="shareToken"
          :label="SHEET_SHARE_TEXT.disable"
          color="error"
          variant="subtle"
          :loading="isBusy"
          @click.left.exact.prevent="disable"
        />

        <UButton
          v-else
          :label="SHEET_SHARE_TEXT.enable"
          :icon="SHEET_SHARE_ICON.link"
          :loading="isBusy"
          @click.left.exact.prevent="enable"
        />
      </div>
    </template>
  </UModal>
</template>
