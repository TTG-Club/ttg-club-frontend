import type { ComputedRef, Ref } from 'vue';

import { getApiErrorMessage } from '~user/model';

import {
  deleteSheetAvatar,
  isSheetAvatarTooLarge,
  SHEET_AVATAR_TEXT,
  uploadSheetAvatar,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/** Возвращаемое значение useSheetAvatar. */
export interface UseSheetAvatarReturn {
  avatarUrl: ComputedRef<string | null>;
  /** Идёт загрузка или удаление файла. */
  isBusy: Ref<boolean>;
  /**
   * Загружает вырезанный портрет вместо прежнего.
   * @param file - вырезанный квадрат
   */
  replaceAvatar: (file: File) => Promise<void>;
  /** Удаляет портрет: файл из хранилища, адрес из листа. */
  clearAvatar: () => Promise<void>;
}

/**
 * Портрет персонажа открытого листа. Файл один на лист и перезаписывается
 * на месте, адрес с меткой версии хранит документ листа — его сохраняет
 * обычное автосохранение.
 */
export function useSheetAvatar(): UseSheetAvatarReturn {
  const toast = useToast();
  const { sheetId, document, update, ensureEditable } = useCharacterSheet();

  const isBusy = ref(false);

  const avatarUrl = computed(() => document.value.avatarUrl);

  /**
   * Уведомление об ошибке: причина от сервера или своя.
   * @param title - заголовок, он же запасная причина
   * @param error - пойманная ошибка или своя причина
   */
  function notifyError(title: string, error: unknown): void {
    toast.add({
      title,
      description:
        typeof error === 'string' ? error : getApiErrorMessage(error, title),
      color: 'error',
    });
  }

  async function replaceAvatar(file: File): Promise<void> {
    const id = sheetId.value;

    if (!id || !ensureEditable()) {
      return;
    }

    if (isSheetAvatarTooLarge(file)) {
      notifyError(SHEET_AVATAR_TEXT.uploadError, SHEET_AVATAR_TEXT.tooLarge);

      return;
    }

    isBusy.value = true;

    try {
      const url = await uploadSheetAvatar(id, file);

      update((current) => ({ ...current, avatarUrl: url }));
    } catch (error) {
      notifyError(SHEET_AVATAR_TEXT.uploadError, error);
    } finally {
      isBusy.value = false;
    }
  }

  async function clearAvatar(): Promise<void> {
    const id = sheetId.value;

    if (!id || !avatarUrl.value || !ensureEditable()) {
      return;
    }

    isBusy.value = true;

    try {
      await deleteSheetAvatar(id);
      update((current) => ({ ...current, avatarUrl: null }));
    } catch (error) {
      notifyError(SHEET_AVATAR_TEXT.removeError, error);
    } finally {
      isBusy.value = false;
    }
  }

  return { avatarUrl, isBusy, replaceAvatar, clearAvatar };
}
