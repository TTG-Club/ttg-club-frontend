import type { EntryExportPlatform } from '../model';

import {
  getEntryExportUrl,
  getExportFileName,
  SECTION_ICON,
  SECTION_TEXT,
} from '../model';

/** Запись, которую выгружают. */
interface ExportedEntry {
  id: number;
  name: string;
}

/**
 * Сохраняет файл на устройство через временную ссылку.
 * @param file - содержимое файла
 * @param fileName - имя файла
 */
function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Экспорт записи в JSON для FVTT и LSS, как в старом SPA. Файл сначала
 * загружается целиком: так ошибку сервера можно показать уведомлением.
 */
export function useEntryExport(): {
  exportEntry: (
    platform: EntryExportPlatform,
    type: string,
    entry: ExportedEntry,
  ) => Promise<void>;
} {
  const toast = useToast();

  /**
   * Выгружает запись.
   * @param platform - платформа экспорта
   * @param type - тип записи в ручке экспорта
   * @param entry - идентификатор и название записи
   */
  async function exportEntry(
    platform: EntryExportPlatform,
    type: string,
    entry: ExportedEntry,
  ): Promise<void> {
    try {
      const response = await $fetch.raw<Blob>(
        getEntryExportUrl(platform, type, entry.id),
        { responseType: 'blob' },
      );

      if (!response._data) {
        throw new Error(SECTION_TEXT.exportError);
      }

      saveFile(
        response._data,
        getExportFileName(
          response.headers.get('content-disposition'),
          entry.name,
        ),
      );
    } catch {
      toast.add({
        title: SECTION_TEXT.exportError,
        icon: SECTION_ICON.export,
        color: 'error',
      });
    }
  }

  return { exportEntry };
}
