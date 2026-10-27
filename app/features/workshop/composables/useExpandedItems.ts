import { shiftIndexesAfterRemoval } from '../model';

/** Раскрытые элементы списка редактора. */
interface ExpandedItems {
  isExpanded: (index: number) => boolean;
  toggle: (index: number) => void;
  expand: (indexes: Array<number>) => void;
  drop: (index: number) => void;
}

/**
 * Свёрнутые под спойлер элементы списка: умения, особенности. Состояние
 * хранится по номерам: у новых элементов ещё нет идентификатора.
 */
export function useExpandedItems(): ExpandedItems {
  const expandedIndexes = ref<Set<number>>(new Set());

  /**
   * Раскрыт ли элемент.
   * @param index - номер элемента
   */
  function isExpanded(index: number): boolean {
    return expandedIndexes.value.has(index);
  }

  /**
   * Разворачивает или сворачивает элемент.
   * @param index - номер элемента
   */
  function toggle(index: number): void {
    const next = new Set(expandedIndexes.value);

    if (!next.delete(index)) {
      next.add(index);
    }

    expandedIndexes.value = next;
  }

  /**
   * Раскрывает элементы: только что добавленный или с ошибками.
   * @param indexes - номера элементов
   */
  function expand(indexes: Array<number>): void {
    expandedIndexes.value = new Set([...expandedIndexes.value, ...indexes]);
  }

  /**
   * Забывает удалённый элемент и сдвигает следующие.
   * @param index - номер удалённого элемента
   */
  function drop(index: number): void {
    expandedIndexes.value = shiftIndexesAfterRemoval(
      expandedIndexes.value,
      index,
    );
  }

  return { isExpanded, toggle, expand, drop };
}
