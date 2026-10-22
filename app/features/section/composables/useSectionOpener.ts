import type { InjectionKey } from 'vue';

import type { SectionOpener } from '../model';

const SECTION_OPENER_KEY: InjectionKey<SectionOpener> =
  Symbol('section-opener');

/**
 * Отдаёт ссылкам списка способ открывать записи.
 * @param opener - открытая запись и открытие новой
 */
export function provideSectionOpener(opener: SectionOpener): void {
  provide(SECTION_OPENER_KEY, opener);
}

/**
 * Способ открывать записи от страницы раздела. Вне раздела, например во
 * вкладке класса, его нет, и ссылка ведёт себя как обычная.
 */
export function useSectionOpener(): SectionOpener | undefined {
  return inject(SECTION_OPENER_KEY, undefined);
}
