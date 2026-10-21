/**
 * Функция `ym` Яндекс.Метрики. До загрузки скрипта это очередь из кода
 * подключения: вызовы копятся в ней, и загруженный скрипт выполняет их по
 * порядку. Имена полей `a` и `l` задаёт сама Метрика, переименовать их нельзя.
 */
export interface YandexMetrikaQueue {
  (counterId: string, method: string, ...parameters: Array<unknown>): void;

  /** Вызовы, накопленные до загрузки скрипта */
  a?: Array<Array<unknown>>;

  /** Время объявления очереди в миллисекундах */
  l?: number;
}

declare global {
  interface Window {
    /** Функция Яндекс.Метрики; создаётся при подключении счётчика */
    ym?: YandexMetrikaQueue;
  }
}
