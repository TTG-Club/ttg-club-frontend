import type { DmScreenRequest } from '../model';

import {
  DM_SCREEN_ICON,
  DM_SCREEN_PATH,
  DM_SCREEN_TEXT,
  isDmScreenPath,
} from '../model';
import { useDmScreen } from './useDmScreen';

/**
 * «В ширму» с любой страницы: запись встаёт окном на ширме, а тост
 * предлагает перейти к ней. Записи разделов, которых ширма не умеет
 * показывать, не добавляются.
 */
export function useDmScreenAdd() {
  const { add } = useDmScreen();
  const toast = useToast();

  /**
   * Добавляет запись в ширму и сообщает об этом.
   * @param request - запись и её название
   */
  function addToScreen(request: DmScreenRequest): void {
    if (!isDmScreenPath(request.path)) {
      return;
    }

    add(request);

    toast.add({
      title: DM_SCREEN_TEXT.added,
      description: request.title,
      icon: DM_SCREEN_ICON.screen,
      actions: [
        {
          label: DM_SCREEN_TEXT.openScreen,
          to: DM_SCREEN_PATH,
          color: 'neutral',
          variant: 'outline',
        },
      ],
    });
  }

  return { addToScreen, isAvailable: isDmScreenPath };
}
