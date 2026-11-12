import type { ComponentPublicInstance, ComputedRef, Ref } from 'vue';

/** Перелистывание новостей в блоке главной. */
interface HomeNewsRotation {
  /** Номер показанной новости, с нуля */
  activeIndex: Ref<number>;
  /** Остановил ли читатель автосмену кнопкой паузы */
  isStopped: Ref<boolean>;
  /** Идёт ли сейчас отсчёт до следующей новости */
  isRunning: ComputedRef<boolean>;
  /** Показывает новость по номеру */
  select: (index: number) => void;
  /** Следующая новость; после последней — снова первая */
  showNext: () => void;
  /** Предыдущая новость; перед первой — последняя */
  showPrevious: () => void;
  /** Ставит автосмену на паузу или снимает с неё */
  toggleStopped: () => void;
  /** Запоминает, открыт ли ролик показанной новости */
  setVideoOpen: (isOpen: boolean) => void;
}

/**
 * Перелистывание новостей по кругу и состояние отсчёта до следующей. Сам
 * отсчёт ведёт CSS-анимация полоски в переключателе: её конец зовёт
 * `showNext`, а остановка анимации и есть пауза — отдельного таймера нет,
 * поэтому полоска и смена новости не могут разойтись.
 *
 * Отсчёт замирает, пока новость разглядывают или читают: курсор или фокус
 * на панели, открыта панель чтения или ролик.
 *
 * @param count - сколько новостей в блоке
 * @param panel - панель блока: курсор и фокус на ней придерживают отсчёт
 * @param isReading - открыта ли панель чтения новости
 * @returns номер показанной новости и управление перелистыванием
 */
export function useHomeNewsRotation(
  count: Ref<number>,
  panel: Ref<ComponentPublicInstance | null>,
  isReading: Ref<boolean>,
): HomeNewsRotation {
  const activeIndex = ref(0);

  // Следим за всей панелью: переключатель стоит в её подвале, и курсор на
  // стрелках тоже должен придерживать отсчёт. Наведению нужен сам элемент
  // панели, а не её компонент
  const panelElement = computed(() => unrefElement(panel));

  const isHovered = useElementHover(panelElement);

  const { focused: isFocused } = useFocusWithin(panelElement);

  const isVideoOpen = ref(false);

  const isHeld = computed(
    () =>
      isHovered.value
      || isFocused.value
      || isReading.value
      || isVideoOpen.value,
  );

  // Тем, кто просил поменьше движения, новости сами не листаются — только
  // по кнопкам. Кнопка «запустить» при этом остаётся рабочей
  const reducedMotion = usePreferredReducedMotion();

  const isStopped = ref(false);

  watch(
    reducedMotion,
    (preference) => {
      if (preference === 'reduce') {
        isStopped.value = true;
      }
    },
    { immediate: true },
  );

  // Скрытая вкладка: браузер не шлёт конец анимации вовремя, а вернувшись,
  // читатель застал бы случайную новость
  const visibility = useDocumentVisibility();

  const isRunning = computed(
    () =>
      count.value > 1
      && !isStopped.value
      && !isHeld.value
      && visibility.value === 'visible',
  );

  // Список обновился и стал короче — показанной новости в нём уже может
  // не быть
  watch(count, (value) => {
    if (activeIndex.value >= value) {
      activeIndex.value = 0;
    }
  });

  /**
   * Показывает новость по номеру.
   *
   * @param index - номер новости, с нуля
   */
  function select(index: number): void {
    activeIndex.value = index;
  }

  /** Показывает следующую новость по кругу. */
  function showNext(): void {
    activeIndex.value = (activeIndex.value + 1) % count.value;
  }

  /** Показывает предыдущую новость по кругу. */
  function showPrevious(): void {
    activeIndex.value = (activeIndex.value - 1 + count.value) % count.value;
  }

  /** Ставит автосмену на паузу или снимает с неё. */
  function toggleStopped(): void {
    isStopped.value = !isStopped.value;
  }

  /**
   * Запоминает, открыт ли ролик показанной новости.
   *
   * @param isOpen - открыт ли ролик
   */
  function setVideoOpen(isOpen: boolean): void {
    isVideoOpen.value = isOpen;
  }

  return {
    activeIndex,
    isStopped,
    isRunning,
    select,
    showNext,
    showPrevious,
    toggleStopped,
    setVideoOpen,
  };
}
