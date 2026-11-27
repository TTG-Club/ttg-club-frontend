import type { Ref } from 'vue';

import type { SheetEditor, SheetEditorList } from '../model';

import { getApiErrorMessage } from '~user/model';

import {
  approveSheetEditor,
  fetchSheetEditors,
  removeSheetEditor,
  SHEET_EDIT_ICON,
  SHEET_EDITORS_TEXT,
} from '../model';
import { useSheetEditRequests } from './useSheetEditRequests';

/** Возвращаемое значение useSheetEditors. */
export interface UseSheetEditorsReturn {
  /** Идёт решение по запросу: кнопки строк заблокированы. */
  isPending: Ref<boolean>;

  /**
   * Неотвеченные запросы листа.
   * @param sheetId - идентификатор листа
   */
  getPendingRequests: (sheetId: string) => Array<SheetEditor>;

  /**
   * Пользователи, которым правки листа уже разрешены.
   * @param sheetId - идентификатор листа
   */
  getApprovedEditors: (sheetId: string) => Array<SheetEditor>;

  /**
   * Остались ли места для новых редакторов листа.
   * @param sheetId - идентификатор листа
   */
  canApproveMore: (sheetId: string) => boolean;

  /**
   * Забывает запросы и редакторов листа: ссылку отключили — права пропали.
   * @param sheetId - идентификатор листа
   */
  forget: (sheetId: string) => void;

  /**
   * Загружает запросы и редакторов листа. Ошибку не показывает: баннер и
   * список необязательны, лист без них работает как прежде.
   * @param sheetId - идентификатор листа
   */
  load: (sheetId: string) => Promise<void>;

  /**
   * Разрешает правки по запросу.
   * @param sheetId - идентификатор листа
   * @param editorId - идентификатор запроса
   */
  approve: (sheetId: string, editorId: string) => Promise<boolean>;

  /**
   * Отклоняет запрос или отзывает выданное право.
   * @param sheetId - идентификатор листа
   * @param editorId - идентификатор запроса или права
   */
  remove: (sheetId: string, editorId: string) => Promise<boolean>;
}

/**
 * Запросы на редактирование и выданные права листов — для владельца: баннер
 * с запросами в листе и список редакторов в окне «Поделиться». Окно открывают
 * и из шапки листа, и из карточки в списке, поэтому состояние общее и
 * разложено по листам. После каждого решения перечитывается сводка входящих
 * запросов — иначе метки в списке ждали бы следующего опроса.
 */
export const useSheetEditors = createSharedComposable(
  (): UseSheetEditorsReturn => {
    const toast = useToast();

    const { refresh: refreshIncoming } = useSheetEditRequests();

    const editorLists = shallowRef<Record<string, SheetEditorList | null>>({});

    const isPending = ref(false);

    /** Номер последнего запроса списка по каждому листу. */
    const latestLoads = new Map<string, number>();

    function getEditors(sheetId: string): Array<SheetEditor> {
      return editorLists.value[sheetId]?.editors ?? [];
    }

    function getPendingRequests(sheetId: string): Array<SheetEditor> {
      return getEditors(sheetId).filter(
        (editor) => editor.status === 'PENDING',
      );
    }

    function getApprovedEditors(sheetId: string): Array<SheetEditor> {
      return getEditors(sheetId).filter(
        (editor) => editor.status === 'APPROVED',
      );
    }

    function canApproveMore(sheetId: string): boolean {
      const list = editorLists.value[sheetId];

      return list ? getApprovedEditors(sheetId).length < list.limit : false;
    }

    /**
     * Кладёт ответ сервера в общее состояние.
     * @param sheetId - идентификатор листа
     * @param list - запросы и редакторы; null — о листе ничего не известно
     */
    function setEditors(sheetId: string, list: SheetEditorList | null): void {
      editorLists.value = { ...editorLists.value, [sheetId]: list };
    }

    function forget(sheetId: string): void {
      setEditors(sheetId, null);
    }

    async function load(sheetId: string): Promise<void> {
      const requestId = (latestLoads.get(sheetId) ?? 0) + 1;

      latestLoads.set(sheetId, requestId);

      try {
        const list = await fetchSheetEditors(sheetId);

        // Список перечитывают и баннер, и окно доступа: запоздавший ответ
        // раннего запроса не должен затереть более свежий
        if (latestLoads.get(sheetId) === requestId) {
          setEditors(sheetId, list);
        }
      } catch {
        if (latestLoads.get(sheetId) === requestId) {
          setEditors(sheetId, null);
        }
      }
    }

    /**
     * Применяет решение владельца и перечитывает сводку запросов.
     * @param sheetId - идентификатор листа
     * @param decide - запрос решения к серверу
     * @returns true, если решение принято
     */
    async function applyDecision(
      sheetId: string,
      decide: () => Promise<SheetEditorList>,
    ): Promise<boolean> {
      isPending.value = true;

      try {
        setEditors(sheetId, await decide());
        void refreshIncoming();

        return true;
      } catch (error) {
        toast.add({
          title: getApiErrorMessage(error, SHEET_EDITORS_TEXT.error),
          color: 'error',
          icon: SHEET_EDIT_ICON.remove,
        });

        return false;
      } finally {
        isPending.value = false;
      }
    }

    function approve(sheetId: string, editorId: string): Promise<boolean> {
      return applyDecision(sheetId, () =>
        approveSheetEditor(sheetId, editorId),
      );
    }

    function remove(sheetId: string, editorId: string): Promise<boolean> {
      return applyDecision(sheetId, () => removeSheetEditor(sheetId, editorId));
    }

    return {
      isPending,
      getPendingRequests,
      getApprovedEditors,
      canApproveMore,
      forget,
      load,
      approve,
      remove,
    };
  },
);
