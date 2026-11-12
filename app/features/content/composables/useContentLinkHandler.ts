import type { InjectionKey } from 'vue';

import type { ContentLinkHandler } from '../model';

const CONTENT_LINK_HANDLER_KEY: InjectionKey<ContentLinkHandler> = Symbol(
  'content-link-handler',
);

/**
 * Отдаёт ссылкам из текста свой способ открывать записи, например окном
 * ширмы вместо дровера или перехода.
 * @param handler - открывает запись и говорит, взялся ли за неё
 */
export function provideContentLinkHandler(handler: ContentLinkHandler): void {
  provide(CONTENT_LINK_HANDLER_KEY, handler);
}

/**
 * Свой способ открывать записи из ссылок в тексте. Без него ссылки ведут
 * себя как обычно: дровер или переход.
 */
export function useContentLinkHandler(): ContentLinkHandler | undefined {
  return inject(CONTENT_LINK_HANDLER_KEY, undefined);
}
