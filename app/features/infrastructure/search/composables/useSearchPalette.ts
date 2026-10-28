/**
 * Открытие окна поиска. Окно одно на всё приложение, а открывают его и кнопка
 * в боковой панели, и строка поиска на главной.
 */
export function useSearchPalette() {
  const isOpen = useState('search-palette-open', () => false);

  function open(): void {
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  return { isOpen, open, close };
}
