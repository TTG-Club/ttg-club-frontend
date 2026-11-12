import type { ComputedRef, Ref } from 'vue';

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
}

/**
 * Перелистывание новостей по кругу и состояние отсчёта до следующей. Сам
 * отсчёт ведёт CSS-анимация полоски в переключателе: её конец зовёт
 * `showNext`, а остановка анимации и есть пауза — отдельного таймера нет,
 * поэтому полоска и смена новости не могут разойтись.
 *
 * @param count - сколько новостей в блоке
 * @param isHeld - отсчёт придержан: курсор на блоке, открыта новость и т.п.
 * @returns номер показанной новости и управление перелистыванием
 */
export function useHomeNewsRotation(
  count: Ref<number>,
  isHeld: Ref<boolean>,
): HomeNewsRotation {
  const activeIndex = ref(0);

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

  return {
    activeIndex,
    isStopped,
    isRunning,
    select,
    showNext,
    showPrevious,
    toggleStopped,
  };
}
