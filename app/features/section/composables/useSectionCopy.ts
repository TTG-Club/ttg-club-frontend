import { SECTION_ICON, SECTION_TEXT } from '../model';

/** Тексты тостов и иконка успеха для одного вида копирования. */
interface CopyMessages {
  success: string;
  error: string;
  icon: string;
}

const LINK_MESSAGES: CopyMessages = {
  success: SECTION_TEXT.linkCopied,
  error: SECTION_TEXT.copyError,
  icon: SECTION_ICON.copy,
};

const TITLE_MESSAGES: CopyMessages = {
  success: SECTION_TEXT.titleCopied,
  error: SECTION_TEXT.titleCopyError,
  icon: SECTION_ICON.copyTitle,
};

/** Возвращаемое значение useSectionCopy. */
export interface UseSectionCopyReturn {
  /** Копирует ссылку на запись и сообщает об итоге тостом. */
  copyLink: (link: string) => Promise<void>;
  /** Копирует название записи и сообщает об итоге тостом. */
  copyTitle: (title: string) => Promise<void>;
}

/**
 * Копирование в буфер из карточки записи с тостом об успехе или ошибке:
 * ссылка из меню записи и название по клику на заголовок, как на
 * new.ttg.club.
 */
export function useSectionCopy(): UseSectionCopyReturn {
  const toast = useToast();
  const { copy, isSupported } = useClipboard({ legacy: true });

  /** Копирует текст, если он есть, и показывает тост с итогом. */
  async function copyText(text: string, messages: CopyMessages): Promise<void> {
    if (!text) {
      return;
    }

    if (!isSupported.value) {
      toast.add({ title: messages.error, color: 'error' });

      return;
    }

    try {
      await copy(text);

      toast.add({ title: messages.success, icon: messages.icon });
    } catch {
      toast.add({ title: messages.error, color: 'error' });
    }
  }

  function copyLink(link: string): Promise<void> {
    return copyText(link, LINK_MESSAGES);
  }

  function copyTitle(title: string): Promise<void> {
    return copyText(title, TITLE_MESSAGES);
  }

  return { copyLink, copyTitle };
}
