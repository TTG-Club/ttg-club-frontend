/** Переменная с шириной полосы прокрутки страницы. */
const SCROLLBAR_WIDTH_PROPERTY = '--app-scrollbar-width';

/** Признак на `html`: прокрутка страницы заблокирована, полосы нет. */
const SCROLL_LOCKED_ATTRIBUTE = 'data-scroll-locked';

/** Признак на `html`: место полосы уже держит чужой отступ на `body`. */
const SCROLL_COMPENSATED_ATTRIBUTE = 'data-scroll-compensated';

/** Пауза перед пересчётом ширины полосы, пока окно меняет размер, мс. */
const MEASURE_DEBOUNCE_MS = 100;

/** Дольше этого пересчёт не откладывается, даже если размер всё ещё меняется, мс. */
const MEASURE_MAX_WAIT_MS = 500;

/**
 * Заблокирована ли прокрутка страницы.
 *
 * Библиотеки блокируют её по-разному и на разных элементах: Reka UI (окна и
 * панели Nuxt UI) ставит инлайновый `overflow: hidden` на `body`, меню сайта
 * через `useScrollLock` — тоже на `body`, а `useScrollLock(window)` — на
 * `html`. Все случаи сводятся здесь к одному ответу, чтобы стили не зависели
 * от чужой реализации.
 *
 * Блокировки бывают вложенными: окно поверх открытого меню блокирует
 * прокрутку вторым слоем. Поэтому она считается снятой, только когда
 * `overflow: hidden` пропал у обоих элементов.
 *
 * @returns заблокирована ли прокрутка
 */
function isScrollLocked(): boolean {
  return [document.documentElement, document.body].some(
    (element) => element.style.overflow === 'hidden',
  );
}

/**
 * Проставляет на `html` признаки блокировки прокрутки для CSS.
 *
 * `data-scroll-locked` — прокрутка заблокирована, полосы больше нет.
 *
 * `data-scroll-compensated` — место полосы уже держит отступ на `body`: так
 * делает Reka UI. Свой отступ на `html` стал бы вторым и сдвинул бы контент
 * влево. Признак — сам отступ, а не библиотека, которая его поставила:
 * VueUse не компенсирует ничего, и там отступ остаётся за нами.
 */
function updateScrollLockMarker(): void {
  const isLocked = isScrollLocked();

  document.documentElement.toggleAttribute(SCROLL_LOCKED_ATTRIBUTE, isLocked);

  document.documentElement.toggleAttribute(
    SCROLL_COMPENSATED_ATTRIBUTE,
    isLocked && document.body.style.paddingRight !== '',
  );
}

/**
 * Записывает ширину полосы прокрутки в CSS-переменную
 * `--app-scrollbar-width`: из неё берут отступы правила в `tailwind.css`.
 *
 * Под блокировкой измерять нечего: полосы уже нет, зато `body` может быть
 * сужен компенсирующим отступом. Разница приняла бы его за полосу, и отступ
 * рос бы с каждым пересчётом.
 *
 * Имя переменной намеренно не `--scrollbar-width`: ту Reka UI сам заводит на
 * `html` при блокировке и удаляет при разблокировке — наше значение
 * стиралось бы после первого же закрытого окна.
 *
 * @param sizes - ширина окна вместе с полосой и ширина `body`
 */
function updateScrollbarWidth(sizes: [number, number]): void {
  if (isScrollLocked()) {
    return;
  }

  const [viewportWidth, bodyWidth] = sizes;
  const width = Math.max(viewportWidth - bodyWidth, 0);

  document.documentElement.style.setProperty(
    SCROLLBAR_WIDTH_PROPERTY,
    `${width}px`,
  );
}

/**
 * Держит место под полосу прокрутки, когда меню или окно блокирует прокрутку
 * страницы: без этого полоса пропадает, страница становится шире, и весь
 * контент прыгает вправо. Перенесено с new.ttg.club.
 */
export default defineNuxtPlugin(() => {
  const { width: windowWidth } = useWindowSize({
    type: 'inner',
    includeScrollbar: true,
  });

  const { width: bodyWidth } = useElementSize(document.body);

  watchDebounced([windowWidth, bodyWidth], updateScrollbarWidth, {
    immediate: true,
    debounce: MEASURE_DEBOUNCE_MS,
    maxWait: MEASURE_MAX_WAIT_MS,
  });

  // Саму блокировку перехватить нельзя: Reka UI выполняет её внутри Nuxt UI.
  // Поэтому за инлайновыми стилями `html` и `body` следит наблюдатель
  useMutationObserver(
    [document.documentElement, document.body],
    updateScrollLockMarker,
    { attributes: true, attributeFilter: ['style'] },
  );

  updateScrollLockMarker();
});
