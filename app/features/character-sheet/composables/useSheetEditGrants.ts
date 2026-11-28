import type { Ref } from 'vue';

import type { SavedSheetEditAccess, SheetEditStatus } from '../model';

import { getApiErrorMessage } from '~user/model';

import {
  fetchSavedSheetEditAccess,
  getEditAccessChanges,
  getSheetRoute,
  requestSheetEdit,
  SHEET_EDIT_ACCESS_POLL_INTERVAL_MS,
  SHEET_EDIT_ACCESS_TEXT,
  SHEET_EDIT_ICON,
} from '../model';

/** Возвращаемое значение useSheetEditGrants. */
export interface UseSheetEditGrantsReturn {
  /** Права на редактирование сохранённых листов: запрошенные и выданные. */
  accesses: Ref<Array<SavedSheetEditAccess>>;

  /** Идёт отправка запроса на редактирование. */
  isRequesting: Ref<boolean>;

  /**
   * Право на редактирование сохранённого листа.
   * @param savedId - идентификатор записи в «Других листах»
   * @returns право; null — не запрашивалось или отклонено
   */
  getStatus: (savedId: string) => SheetEditStatus | null;

  /** Перечитывает сводку прав. */
  refresh: () => Promise<void>;

  /**
   * Просит владельца разрешить правки сохранённого листа.
   * @param savedId - идентификатор записи в «Других листах»
   * @returns состояние права; null — запрос не ушёл
   */
  requestEdit: (savedId: string) => Promise<SheetEditStatus | null>;
}

/**
 * Права на редактирование чужих листов — у того, кто их сохранил: запрос,
 * его ожидание и ответы владельцев тостами («Редактирование разрешено» со
 * ссылкой на лист, «В редактировании отказано»).
 *
 * Общий для раздела «Другие листы» и листа, открытого по ссылке: опрос один.
 * Сводка опрашивается только пока есть запрос без ответа — новых разрешений
 * без запроса не бывает.
 *
 * Побочные эффекты: запрос сводки при входе и затем по таймеру, тосты.
 */
export const useSheetEditGrants = createSharedComposable(
  (): UseSheetEditGrantsReturn => {
    const { isLoggedIn } = useUser();
    const toast = useToast();

    const accesses = shallowRef<Array<SavedSheetEditAccess>>([]);
    const isRequesting = ref(false);

    /** Сводка ещё не загружалась: первый ответ — точка отсчёта без тостов. */
    let isLoaded = false;

    const hasPendingRequests = computed(() =>
      accesses.value.some((access) => access.status === 'PENDING'),
    );

    function getStatus(savedId: string): SheetEditStatus | null {
      return (
        accesses.value.find((access) => access.savedId === savedId)?.status
        ?? null
      );
    }

    /**
     * Тост о новом разрешении со ссылкой на лист.
     * @param access - выданное право
     */
    function notifyGranted(access: SavedSheetEditAccess): void {
      toast.add({
        title: SHEET_EDIT_ACCESS_TEXT.grantedTitle,
        description: SHEET_EDIT_ACCESS_TEXT.grantedDescription(access.name),
        color: 'success',
        icon: SHEET_EDIT_ICON.editor,
        actions: [
          {
            label: SHEET_EDIT_ACCESS_TEXT.grantedAction,
            onClick: () => navigateTo(getSheetRoute(access.sheetId)),
          },
        ],
      });
    }

    /**
     * Тост об отказе владельца.
     * @param access - запрос, который пропал из сводки
     */
    function notifyDeclined(access: SavedSheetEditAccess): void {
      toast.add({
        title: SHEET_EDIT_ACCESS_TEXT.declinedTitle,
        description: SHEET_EDIT_ACCESS_TEXT.declinedDescription(access.name),
        color: 'warning',
        icon: SHEET_EDIT_ICON.declined,
      });
    }

    async function refresh(): Promise<void> {
      if (!isLoggedIn.value) {
        accesses.value = [];

        return;
      }

      try {
        const next = await fetchSavedSheetEditAccess();

        const changes = getEditAccessChanges(
          isLoaded ? accesses.value : null,
          next,
        );

        accesses.value = next;
        isLoaded = true;

        changes.granted.forEach(notifyGranted);
        changes.declined.forEach(notifyDeclined);
      } catch {
        // Сводка необязательна: следующий опрос повторит
      }
    }

    async function requestEdit(
      savedId: string,
    ): Promise<SheetEditStatus | null> {
      isRequesting.value = true;

      try {
        const status = await requestSheetEdit(savedId);
        const isApproved = status === 'APPROVED';

        toast.add({
          title: isApproved
            ? SHEET_EDIT_ACCESS_TEXT.alreadyApprovedTitle
            : SHEET_EDIT_ACCESS_TEXT.sentTitle,
          description: isApproved
            ? SHEET_EDIT_ACCESS_TEXT.alreadyApprovedDescription
            : SHEET_EDIT_ACCESS_TEXT.sentDescription,
          color: 'success',
          icon: SHEET_EDIT_ICON.request,
        });

        // Свежая сводка знает о запросе — с ней начинается опрос ответа
        await refresh();

        return status;
      } catch (error) {
        toast.add({
          title: getApiErrorMessage(error, SHEET_EDIT_ACCESS_TEXT.requestError),
          color: 'error',
        });

        return null;
      } finally {
        isRequesting.value = false;
      }
    }

    useIntervalFn(() => {
      if (hasPendingRequests.value) {
        void refresh();
      }
    }, SHEET_EDIT_ACCESS_POLL_INTERVAL_MS);

    // Вход и выход перечитывают сводку сразу
    watch(
      isLoggedIn,
      () => {
        void refresh();
      },
      { immediate: true },
    );

    return { accesses, isRequesting, getStatus, refresh, requestEdit };
  },
);
