import type { SheetDocument } from '../model';

import { getApiErrorMessage } from '~user/model';

import {
  getSheetShareUrl,
  shareSheet,
  SHEET_PDF_ICON,
  SHEET_PDF_TEXT,
  SHEET_SHARE_TEXT,
} from '../model';

/** Что экспорт знает о ссылке на лист, кроме самого документа. */
export interface SheetPdfExportOptions {
  /** Секрет ссылки на лист; null — доступ по ссылке выключен. */
  shareToken: string | null;

  /**
   * Свой лист: без ссылки экспорт сам включает доступ по ней, чтобы QR-коду
   * в документе было куда вести. Чужому листу доступ не выдаём — это право
   * владельца; null — лист чужой (открыт или сохранён по ссылке).
   */
  ownSheetId: string | null;
}

/**
 * Экспорт листа персонажа в PDF. Состояние локальное, а не общее: экспорт
 * запускают и из шапки открытого листа, и из любой карточки списка — общий флаг
 * показывал бы загрузку сразу во всех меню.
 *
 * Сборщик и pdf-lib грузятся динамически: они нужны только в момент экспорта,
 * а в основном бандле весили бы больше самого листа.
 *
 * @returns признак идущей сборки и запуск экспорта.
 */
export function useSheetPdf() {
  const toast = useToast();
  const requestUrl = useRequestURL();

  const isExporting = ref(false);

  /**
   * Включает доступ по ссылке у своего листа ради QR-кода и сообщает об этом.
   * Не вышло — PDF всё равно собирается, просто без кода.
   *
   * @param sheetId идентификатор своего листа.
   * @returns новый секрет ссылки или null при ошибке.
   */
  async function enableShare(sheetId: string): Promise<string | null> {
    try {
      const token = await shareSheet(sheetId);

      toast.add({
        title: SHEET_PDF_TEXT.shareEnabledTitle,
        description: SHEET_PDF_TEXT.shareEnabledDescription,
        color: 'success',
        icon: SHEET_PDF_ICON.shareEnabled,
      });

      return token;
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_SHARE_TEXT.error),
        color: 'error',
        icon: SHEET_PDF_ICON.error,
      });

      return null;
    }
  }

  /**
   * Сборка и скачивание PDF. Упасть может и загрузка чанка сборщика со
   * шрифтами — причину показываем тостом, иначе клик по пункту меню выглядел
   * бы проигнорированным.
   *
   * @param name имя персонажа.
   * @param document документ листа.
   * @param options секрет ссылки и право включить доступ.
   * @returns секрет ссылки, если экспорт только что включил доступ, — его
   * нужно запомнить в состоянии листа; иначе null.
   */
  async function exportToPdf(
    name: string,
    document: SheetDocument,
    options: SheetPdfExportOptions,
  ): Promise<string | null> {
    if (isExporting.value) {
      return null;
    }

    isExporting.value = true;

    let enabledToken: string | null = null;

    try {
      if (!options.shareToken && options.ownSheetId) {
        enabledToken = await enableShare(options.ownSheetId);
      }

      const token = options.shareToken ?? enabledToken;
      const { downloadCharacterSheetPdf } = await import('../model/pdf');

      await downloadCharacterSheetPdf(
        { name, document },
        {
          shareUrl: token ? getSheetShareUrl(requestUrl.origin, token) : null,
        },
      );
    } catch (error) {
      toast.add({
        title: SHEET_PDF_TEXT.error,
        description: error instanceof Error ? error.message : undefined,
        color: 'error',
        icon: SHEET_PDF_ICON.error,
      });
    } finally {
      isExporting.value = false;
    }

    return enabledToken;
  }

  return { isExporting, exportToPdf };
}
