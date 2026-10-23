import type { BugReportRequest, TextSelection } from '../model';

import { consola } from 'consola';

import { USER_SESSION_MARKER_COOKIE } from '#shared/consts';
import { getErrorStatus } from '~user/model';

import {
  BUG_REPORT_API_URL,
  BUG_REPORT_GUEST_ID_STORAGE_KEY,
  BUG_REPORT_ICON,
  BUG_REPORT_SOURCE_PLATFORM,
  BUG_REPORT_TEXT,
  BUG_REPORT_TOO_MANY_REQUESTS_STATUS,
  formatSelectionText,
  getScreenshotFileName,
} from '../model';

/**
 * Баг-репорт: окно открывается с адресом текущей страницы и, если есть,
 * выделенным текстом, а уходит репорт прямо в сервис баг-репортов.
 */
export function useBugReport() {
  const toast = useToast();

  const isOpen = useState('bug-report:open', () => false);
  const pageUrl = useState('bug-report:page-url', () => '');

  const textSelection = useState<TextSelection | null>(
    'bug-report:text-selection',
    () => null,
  );

  // Видимая отметка о входе хранит access-токен, как в старом SPA
  const userToken = useCookie<string | null>(USER_SESSION_MARKER_COOKIE, {
    readonly: true,
  });

  /** Открывает окно репорта для текущей страницы. */
  function openReport(): void {
    pageUrl.value = window.location.href;
    isOpen.value = true;
  }

  /**
   * Открывает окно репорта с выделенным текстом.
   * @param selection - выделение и его окружение
   */
  function openReportWithSelection(selection: TextSelection): void {
    textSelection.value = selection;
    openReport();
  }

  function clearTextSelection(): void {
    textSelection.value = null;
  }

  /** Закрывает окно и забывает страницу и выделение. */
  function close(): void {
    isOpen.value = false;
    pageUrl.value = '';
    textSelection.value = null;
  }

  /** Ключ гостя: по нему сервис ограничивает частоту репортов. */
  function getGuestId(): string {
    const saved = localStorage.getItem(BUG_REPORT_GUEST_ID_STORAGE_KEY);

    if (saved) {
      return saved;
    }

    const created = crypto.randomUUID();

    localStorage.setItem(BUG_REPORT_GUEST_ID_STORAGE_KEY, created);

    return created;
  }

  /**
   * Отправляет репорт.
   * @param description - описание проблемы
   * @param screenshot - скриншот с пометками
   * @returns удалось ли отправить
   */
  async function submit(
    description: string,
    screenshot: Blob | null,
  ): Promise<boolean> {
    const token = userToken.value;

    const request: BugReportRequest = {
      description,
      url: pageUrl.value || undefined,
      sourcePlatform: BUG_REPORT_SOURCE_PLATFORM,
      sessionId: token ? undefined : getGuestId(),
      selectedText: textSelection.value
        ? formatSelectionText(textSelection.value)
        : undefined,
    };

    const body = new FormData();

    body.append(
      'request',
      new Blob([JSON.stringify(request)], { type: 'application/json' }),
    );

    if (screenshot) {
      body.append('screenshot', screenshot, getScreenshotFileName(screenshot));
    }

    try {
      await $fetch(BUG_REPORT_API_URL, {
        method: 'POST',
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'omit',
      });

      toast.add({
        title: BUG_REPORT_TEXT.sent,
        description: BUG_REPORT_TEXT.sentDescription,
        color: 'success',
        icon: BUG_REPORT_ICON.bug,
      });

      close();

      return true;
    } catch (error) {
      consola.error('Не удалось отправить баг-репорт', error);

      const isTooMany =
        getErrorStatus(error) === BUG_REPORT_TOO_MANY_REQUESTS_STATUS;

      toast.add({
        title: BUG_REPORT_TEXT.failed,
        description: isTooMany
          ? BUG_REPORT_TEXT.tooMany
          : BUG_REPORT_TEXT.failedDescription,
        color: 'error',
        icon: BUG_REPORT_ICON.failed,
      });

      return false;
    }
  }

  return {
    isOpen,
    pageUrl: readonly(pageUrl),
    textSelection: readonly(textSelection),

    openReport,
    openReportWithSelection,
    clearTextSelection,
    close,
    submit,
  };
}
