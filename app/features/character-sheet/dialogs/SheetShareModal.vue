<script setup lang="ts">
  import { getApiErrorMessage } from '~user/model';

  import {
    getSheetShareUrl,
    shareSheet,
    SHEET_SHARE_ICON,
    SHEET_SHARE_TEXT,
    unshareSheet,
  } from '../model';

  /**
   * Доступ к листу по ссылке: включение, копирование и отзыв. Ссылка одна на
   * лист; отзыв гасит её навсегда, повторное включение выдаёт новую.
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
