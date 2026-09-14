import type { StyleValue } from 'vue';

/** Промо-карточка главной: картинка во всю карточку и подпись поверх неё */
export type HomePromoCardContent = {
  /** Моно-подпись над заголовком */
  eyebrow: string;
  title: string;
  description?: string;
  /** Подпись ссылки со стрелкой; без неё строка ссылки не рисуется */
  linkLabel?: string;
  image: string;
  /** Маршрут внутри сайта или адрес внешней страницы (см. `external`) */
  to: string;
  /** Внешняя ссылка открывается в новой вкладке */
  external?: boolean;
};

/** Бренд соцсети — задаёт цвет рамки и иконки кнопки */
export type HomeSocialBrand = 'telegram' | 'discord' | 'vk' | 'boosty';

export type HomeSocialLink = {
  name: string;
  url: string;
  icon: string;
  brand: HomeSocialBrand;
};

/** Ссылка главной на раздел или инструмент из меню сайта */
export type HomeNavLink = {
  name: string;
  url: string;
  icon: string;
  /** Внешняя ссылка открывается в новой вкладке */
  external?: boolean;
};

/** Плитка раздела: к ссылке добавлен кадр фактуры из спрайта */
export type HomeSectionLink = HomeNavLink & {
  /** Стиль слоя фактуры; `undefined`, если кадра для раздела в спрайте нет */
  textureStyle: StyleValue | undefined;
};
