import type { DmScreenRequest, DmScreenSummary } from '../model';

import { getApiErrorMessage } from '~user/model';

import {
  appendDmScreenWindow,
  createDmScreen,
  DM_SCREEN_DEFAULT_NAME,
  DM_SCREEN_ICON,
  DM_SCREEN_PATH,
  DM_SCREEN_TEXT,
  fetchDmScreen,
  fetchDmScreenList,
  getDmScreenPagePath,
  isDmScreenPath,
  saveDmScreenWindows,
} from '../model';
import { useDmScreen } from './useDmScreen';

/** Куда легла запись: ширма и её страница. */
interface DmScreenTarget {
  id: string;
  name: string;
}

/**
 * «В ширму» с любой страницы: запись встаёт окном на ширме, а тост
 * предлагает перейти к ней. У гостя ширма одна, в браузере. У пользователя
 * ширма на сервере: если её нет, создаётся «Моя ширма». Ширма у пользователя
 * пока одна, поэтому запись идёт в ту же, что открывает страница ширмы, —
 * первую в списке; выбор ширмы (`DmScreenPickModal`) вернётся вместе с
 * несколькими ширмами. Записи разделов, которых ширма не умеет показывать,
 * не добавляются.
 */
export function useDmScreenAdd() {
  const { add, screenId } = useDmScreen();
  const { isLoggedIn } = useUser();
  const toast = useToast();
  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  /**
   * Сообщает, что запись добавлена, со ссылкой на ширму.
   * @param request - добавленная запись
   * @param to - страница ширмы
   */
  function notify(request: DmScreenRequest, to: string): void {
    toast.add({
      title: DM_SCREEN_TEXT.added,
      description: request.title,
      icon: DM_SCREEN_ICON.screen,
      actions: [
        {
          label: DM_SCREEN_TEXT.openScreen,
          to,
          color: 'neutral',
          variant: 'outline',
        },
      ],
    });
  }

  /**
   * Ширма для записи: первая в списке или новая «Моя ширма».
   * @param screens - ширмы пользователя
   * @returns ширма, в которую ляжет запись
   */
  async function pickTarget(
    screens: ReadonlyArray<DmScreenSummary>,
  ): Promise<DmScreenTarget> {
    const [existing] = screens;

    if (existing) {
      return existing;
    }

    const created = await createDmScreen(DM_SCREEN_DEFAULT_NAME);

    return { id: created.id, name: created.name };
  }

  /**
   * Кладёт запись в ширму пользователя. Открытая сейчас ширма меняется на
   * месте, остальные — через сервер.
   * @param request - запись и её название
   */
  async function addToAccount(request: DmScreenRequest): Promise<void> {
    const { items } = await fetchDmScreenList();
    const target = await pickTarget(items);

    if (target.id === screenId.value) {
      add(request);
    } else {
      const screen = await fetchDmScreen(target.id);

      const { windows } = appendDmScreenWindow(
        screen.windows,
        request,
        { width: viewportWidth.value, height: viewportHeight.value },
        crypto.randomUUID(),
      );

      await saveDmScreenWindows(target.id, windows);
    }

    notify(request, getDmScreenPagePath(target.id));
  }

  /**
   * Добавляет запись в ширму и сообщает об этом.
   * @param request - запись и её название
   */
  async function addToScreen(request: DmScreenRequest): Promise<void> {
    if (!isDmScreenPath(request.path)) {
      return;
    }

    if (!isLoggedIn.value) {
      add(request);
      notify(request, DM_SCREEN_PATH);

      return;
    }

    try {
      await addToAccount(request);
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, DM_SCREEN_TEXT.errorAdd),
        color: 'error',
      });
    }
  }

  return { addToScreen, isAvailable: isDmScreenPath };
}
