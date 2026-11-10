/** Видеоплощадка, с которой можно встроить ролик. */
export type VideoProvider = 'youtube' | 'vk';

/** Разобранная ссылка на ролик. */
export interface VideoSource {
  provider: VideoProvider;
  /**
   * Нормализованная ссылка на ролик: её сохраняем в записи и по ней же
   * открываем ролик на сайте площадки.
   */
  url: string;
  /** Адрес встраиваемого плеера с автозапуском — он грузится по нажатию. */
  embedUrl: string;
  /** Превью площадки. У ВК без их API превью не получить — тогда `null`. */
  thumbnailUrl: string | null;
}
