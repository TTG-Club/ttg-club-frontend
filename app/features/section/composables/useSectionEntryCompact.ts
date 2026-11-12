import type { InjectionKey } from 'vue';

const SECTION_ENTRY_COMPACT_KEY: InjectionKey<boolean> = Symbol(
  'section-entry-compact',
);

/**
 * Компактный вид записей внутри: без кнопок записи (закладки, меню
 * действий, закрытия) и без комментариев. Нужен, например, в окне ширмы,
 * где у окна свои кнопки, а обсуждение во время игры не нужно.
 */
export function provideSectionEntryCompact(): void {
  provide(SECTION_ENTRY_COMPACT_KEY, true);
}

/** Показывается ли запись в компактном виде. */
export function useSectionEntryCompact(): boolean {
  return inject(SECTION_ENTRY_COMPACT_KEY, false);
}
