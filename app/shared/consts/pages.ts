/** Тексты страницы ошибки. */
export const ERROR_PAGE = {
  notFoundTitle: 'Страница не найдена',
  defaultTitle: 'Что-то пошло не так',
} as const;

/** HTTP-статус «не найдено». */
export const NOT_FOUND_STATUS = 404;

/** Подпись ошибки со ссылкой на главную посреди фразы. */
export interface ErrorMessage {
  /** Крупная подпись: код ошибки или «Внимание». */
  heading: string;
  before: string;
  link: string;
  after: string;
}

const ACCESS_DENIED_TEXT = {
  before:
    'Вы не прокинули проверку Расследования, у вас нет доступа к этой тайне, стоит вернуться к',
  link: 'началу',
  after: '',
} as const;

/** Фразы ошибок из старого SPA по HTTP-статусу. */
export const ERROR_MESSAGES: Partial<Record<number, ErrorMessage>> = {
  401: { heading: '401', ...ACCESS_DENIED_TEXT },
  403: { heading: '403', ...ACCESS_DENIED_TEXT },
  404: {
    heading: '404',
    before: 'Вы не прокинули проверку выживания, стоит вернуться к',
    link: 'началу',
    after: '',
  },
  500: {
    heading: '500',
    before: 'Вселенная не отвечает, надо подумать',
    link: 'над другим',
    after: '',
  },
};

/** Фраза ошибки, которой нет в списке. */
export const ERROR_MESSAGE_UNKNOWN: ErrorMessage = {
  heading: 'Внимание',
  before: 'Ошибка которую мы не знаем, посмотри',
  link: 'в другом',
  after: 'месте',
};
