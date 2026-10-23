import { COMMENT_TEXT, COMMENTS_ICON } from '../model';

/** Возвращаемое значение useCommentLinkCopy. */
export interface UseCommentLinkCopyReturn {
  /** Копирует ссылку и сообщает об итоге тостом. */
  copyLink: (link: string) => Promise<void>;
}

/** Копирование ссылки на комментарий с тостом об успехе или ошибке. */
export function useCommentLinkCopy(): UseCommentLinkCopyReturn {
  const toast = useToast();
  const { copy, isSupported } = useClipboard({ legacy: true });

  async function copyLink(link: string): Promise<void> {
    if (!isSupported.value) {
      toast.add({ title: COMMENT_TEXT.copyError, color: 'error' });

      return;
    }

    try {
      await copy(link);

      toast.add({ title: COMMENT_TEXT.linkCopied, icon: COMMENTS_ICON.copied });
    } catch {
      toast.add({ title: COMMENT_TEXT.copyError, color: 'error' });
    }
  }

  return { copyLink };
}
