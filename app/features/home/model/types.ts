import type { CSSProperties } from 'vue';

/** Промо-карточка главной: картинка во всю карточку и подпись поверх неё */
export interface HomePromoCardContent {
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
}

/** Ссылка главной на раздел или инструмент из меню сайта */
export interface HomeNavLink {
  name: string;
  url: string;
  icon: string;
  /** Внешняя ссылка открывается в новой вкладке */
  external: boolean;
}

/** Плитка раздела: к ссылке добавлен кадр фактуры из спрайта */
export interface HomeSectionLink extends HomeNavLink {
  /** Стиль слоя фактуры; `undefined`, если кадра для раздела в спрайте нет */
  textureStyle: CSSProperties | undefined;
}

/** Ссылка на соцсеть с цветом бренда для рамки и иконки */
export interface HomeSocialLink {
  name: string;
  url: string;
  icon: string;
  /** CSS-переменная цвета бренда из палитры */
  color: string;
}

/** Друг сайта в блоке «Наши друзья» */
export interface HomePartner {
  name: string;
  description?: string;
  img: string;
  url: string;
  order: number;
}

/** Ролик с YouTube-канала сайта */
export interface HomeVideo {
  id: string;
  name: string;
}
