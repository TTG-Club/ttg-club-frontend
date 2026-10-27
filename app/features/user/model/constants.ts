/** Подпись кнопки входа на боковой панели. */
export const SIGN_IN_BUTTON_LABEL = 'Войти';

/** Подпись кнопки меню вошедшего пользователя. */
export const USER_MENU_BUTTON_LABEL = 'Профиль';

/** Иконка шлема гостя. */
export const GUEST_HELMET_ICON = 'ttg:profile-helmet-outline';

/** Иконка шлема вошедшего пользователя. */
export const USER_HELMET_ICON = 'ttg:profile-helmet-filled';

/** Пункт меню пользователя «Личный кабинет». */
export const USER_MENU_PROFILE_LINK = {
  label: 'Личный кабинет',
  icon: 'tabler:user-cog',
} as const;

/** Пункт меню редактора: ролики на главной. */
export const USER_MENU_ADMIN_LINK = {
  label: 'Видео на главной',
  to: '/admin/youtube',
  icon: 'tabler:brand-youtube',
} as const;

/** Пункт меню редактора: мастерская. */
export const USER_MENU_WORKSHOP_LINK = {
  label: 'Мастерская',
  to: '/workshop',
  icon: 'tabler:tools',
} as const;

/** Подпись кнопки выхода. */
export const SIGN_OUT_LABEL = 'Выйти';

/** Приветствия по времени суток: час, до которого действует приветствие. */
export const GREETINGS = [
  { untilHour: 6, text: 'Доброй ночи' },
  { untilHour: 12, text: 'Доброе утро' },
  { untilHour: 18, text: 'Добрый день' },
  { untilHour: 24, text: 'Добрый вечер' },
] as const;

/** Тексты формы входа. */
export const SIGN_IN_FORM = {
  title: 'Вход',
  description: 'Рады видеть вас снова',
  loginPlaceholder: 'Логин или электронная почта',
  passwordPlaceholder: 'Пароль',
  showPasswordLabel: 'Показать пароль',
  hidePasswordLabel: 'Скрыть пароль',
  rememberLabel: 'Запомнить меня',
  submitLabel: 'Войти',
  closeLabel: 'Закрыть',
  forgotPassword: 'Забыли пароль?',
  noAccount: 'Нет аккаунта?',
  signUp: 'Зарегистрироваться',
} as const;

/** Формы окна входа. */
export const AUTH_VIEWS = ['sign-in', 'sign-up', 'password-reset'] as const;

/** Тексты формы регистрации. */
export const SIGN_UP_FORM = {
  title: 'Регистрация',
  description: 'Пара минут, и аккаунт готов',
  usernamePlaceholder: 'Имя пользователя',
  emailPlaceholder: 'Электронная почта',
  passwordPlaceholder: 'Пароль',
  repeatPlaceholder: 'Повторите пароль',
  specialCharacters: 'Допустимые спецсимволы',
  offerBefore: 'Принимаю условия',
  offerLink: 'публичной оферты',
  privacyBefore:
    'Даю согласие на обработку персональных данных в соответствии с',
  privacyLink: 'политикой конфиденциальности',
  submitLabel: 'Зарегистрироваться',
  hasAccount: 'Уже есть аккаунт?',
  signIn: 'Войти',
} as const;

/** Уведомления о регистрации. */
export const SIGN_UP_TOASTS = {
  success: 'Регистрация прошла успешно!',
  successDescription:
    'Подтвердите почту по ссылке из письма. Ссылка действует сутки.',
  failed: 'Ошибка регистрации',
  failedDescription: 'Не удалось зарегистрироваться, попробуйте ещё раз',
} as const;

/** Тексты сброса пароля: письмо со ссылкой и новый пароль по ней. */
export const PASSWORD_RESET_FORM = {
  title: 'Сброс пароля',
  description: 'Пришлём ссылку для нового пароля на почту',
  emailPlaceholder: 'Электронная почта',
  submitLabel: 'Отправить ссылку',
  sent: 'Ссылка для изменения пароля отправлена на указанную почту',
  remembered: 'Вспомнили пароль?',
  signIn: 'Войти',
  newTitle: 'Новый пароль',
  newDescription: 'Придумайте новый пароль для входа',
  passwordPlaceholder: 'Новый пароль',
  repeatPlaceholder: 'Повторите пароль',
  saveLabel: 'Сохранить пароль',
  saved: 'Пароль успешно изменён, войдите с новым паролем',
  checking: 'Проверяем ссылку…',
  noToken: 'В ссылке нет ключа сброса: откройте её из письма целиком',
  invalidToken: 'Не удалось проверить ссылку для сброса пароля',
  requestAgain: 'Запросить новую ссылку',
  failed: 'Не удалось сменить пароль',
  home: 'На главную',
} as const;

/** Тексты подтверждения почты. */
export const VERIFY_EMAIL_PAGE = {
  title: 'Подтверждение почты',
  pending: 'Подтверждаем почту…',
  success: 'Почта подтверждена, теперь можно войти',
  failed: 'Не удалось подтвердить почту: ссылка устарела или уже использована',
  noToken: 'Некорректная ссылка подтверждения почты',
  signIn: 'Войти',
  home: 'На главную',
} as const;

/** Длина имени пользователя и пароля, как в старом SPA. */
export const AUTH_LIMIT = {
  usernameMin: 5,
  passwordMin: 8,
  max: 1000,
} as const;

/** Подсказки проверки полей. */
export const AUTH_VALIDATION = {
  required: 'Поле обязательно для заполнения',
  usernameChars: 'Допустимы латинские буквы, цифры и - _ .',
  email: 'Недопустимый формат адреса',
  passwordChars: 'Недопустимые символы',
  repeat: 'Пароли не совпадают',
  usernameTaken: 'Это имя пользователя уже занято',
  emailTaken: 'Этот адрес уже занят',
  consent: 'Без согласия зарегистрироваться нельзя',
  usernameMin: `Не менее ${AUTH_LIMIT.usernameMin} символов`,
  passwordMin: `Не менее ${AUTH_LIMIT.passwordMin} символов`,
  max: `Не более ${AUTH_LIMIT.max} символов`,
} as const;

/** Спецсимволы, которые сервис авторизации принимает в пароле. */
export const PASSWORD_SPECIAL_CHARACTERS = '\'-!"#$%&()*,./:;?@[]^_`{|}~+<=>';

/** Имя пользователя: латиница, цифры, `-`, `_` и `.`. */
export const USERNAME_PATTERN = /^[\w\-.]+$/;

/** Почта, как её проверял старый SPA. */
export const EMAIL_PATTERN = /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/** Пароль: латиница, цифры и спецсимволы из списка. */
export const PASSWORD_PATTERN = /^[\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+$/;

/** Ответ на занятое имя или почту. */
export const TAKEN_STATUS = 409;

/**
 * Оферта и политика живут на new.ttg.club: регистрация общая для обоих
 * сайтов. Редакции уходят вместе с согласиями и должны совпадать с датами
 * документов там.
 */
export const LEGAL_DOCUMENTS = {
  offerUrl: 'https://new.ttg.club/offer',
  offerVersion: '2026-10-09',
  privacyUrl: 'https://new.ttg.club/privacy',
  privacyVersion: '2026-09-18',
} as const;

/** Страницы ссылок из писем, адреса как в старом SPA. */
export const AUTH_ROUTE = {
  passwordReset: '/reset-password',
  verifyEmail: '/verify-email',
  home: '/',
} as const;

/** Иконки форм аккаунта. */
export const AUTH_ICON = {
  user: 'tabler:user',
  email: 'tabler:mail',
  password: 'tabler:lock',
  repeat: 'tabler:lock-check',
  show: 'tabler:eye',
  hide: 'tabler:eye-off',
  error: 'tabler:user-exclamation',
  success: 'tabler:user-check',
  sent: 'tabler:mail-check',
  pending: 'tabler:loader-2',
  failed: 'tabler:mail-x',
  verified: 'tabler:mail-check',
} as const;

/** Уведомления о входе. */
export const SIGN_IN_TOASTS = {
  success: 'Вы успешно авторизовались!',
  emptyFields: 'Проверьте правильность заполнения полей',
  wrongCredentials: 'Неверный логин или пароль',
  profileFailed: 'Не удалось загрузить профиль, попробуйте ещё раз',
  unknownError: 'Неизвестная ошибка',
} as const;

/** Статус ответа бэкенда на неверный логин или пароль. */
export const WRONG_CREDENTIALS_STATUS = 401;

/** Адрес личного кабинета, как в старом SPA. */
export const PROFILE_ROUTE = '/profile';

/** Тексты личного кабинета. */
export const PROFILE_TEXT = {
  title: 'Личный кабинет',
  guestTitle: 'Личный кабинет доступен после входа',
  guestDescription: 'Войдите, чтобы сменить имя, пароль или ввести промокод',
  signIn: 'Войти',
  signOut: 'Выйти',
  personal: 'Личные данные',
  displayName: 'Отображаемое имя',
  displayNameHelp: 'Его видят другие в ваших комментариях вместо логина',
  displayNamePlaceholder: 'Например, Отважный Странник',
  save: 'Сохранить',
  username: 'Логин',
  email: 'Почта',
  displayNameSaved: 'Имя обновлено',
  displayNameFailed: 'Не удалось сменить имя',
  password: 'Смена пароля',
  currentPassword: 'Текущий пароль',
  newPassword: 'Новый пароль',
  repeatPassword: 'Повторите новый пароль',
  changePassword: 'Сменить пароль',
  passwordSaved: 'Пароль успешно изменён',
  passwordFailed: 'Не удалось сменить пароль',
  sources: 'Источники по умолчанию',
  sourcesHelp:
    'С этими источниками открываются все разделы. Ссылка с выбранными источниками показывает их как есть.',
  sourcesSelectAll: 'Выбрать все',
  sourcesSaved: 'Источники по умолчанию сохранены',
  sourcesFailed: 'Не удалось сохранить источники',
  sourcesLoadFailed: 'Не удалось загрузить источники',
  sourcesNoneSelected: 'Выберите хотя бы один источник',
  navigation: 'Разделы личного кабинета',
} as const;

/** Разделы личного кабинета: общие данные живут по старому адресу. */
export const PROFILE_SECTIONS = [
  {
    to: PROFILE_ROUTE,
    label: 'Общие',
    icon: 'tabler:user',
  },
  {
    to: `${PROFILE_ROUTE}/sources`,
    label: 'Источники',
    icon: 'tabler:books',
  },
  {
    to: `${PROFILE_ROUTE}/subscription`,
    label: 'Подписка',
    icon: 'tabler:crown',
  },
  {
    to: `${PROFILE_ROUTE}/security`,
    label: 'Безопасность',
    icon: 'tabler:shield-lock',
  },
] as const;

/** Ключ данных источников по умолчанию в личном кабинете. */
export const PROFILE_SOURCES_KEY = 'profile-default-sources';

/** Отображаемое имя, как в старом SPA и на new.ttg.club. */
export const DISPLAY_NAME_LIMIT = {
  min: 2,
  max: 24,
} as const;

/** Отображаемое имя: буквы любого алфавита, цифры, пробел, `-` и `_`. */
export const DISPLAY_NAME_PATTERN = /^[\w\p{L}\s-]+$/u;

/** Подсказки проверки полей личного кабинета. */
export const PROFILE_VALIDATION = {
  displayNameMin: `Минимум ${DISPLAY_NAME_LIMIT.min} символа`,
  displayNameMax: `Максимум ${DISPLAY_NAME_LIMIT.max} символа`,
  displayNameChars: 'Только буквы, цифры, пробелы, дефисы и подчёркивания',
  samePassword: 'Новый пароль должен отличаться от текущего',
} as const;

/** Подписи ролей; незнакомая роль показывается как есть. */
export const ROLE_LABELS: Readonly<Record<string, string>> = {
  USER: 'Пользователь',
  WRITER: 'Автор',
  SUBSCRIBER: 'Подписчик',
  MODERATOR: 'Модератор',
  ADMIN: 'Администратор',
};

/** Иконки личного кабинета. */
export const PROFILE_ICON = {
  guest: 'tabler:user-off',
  personal: 'tabler:user-edit',
  displayName: 'tabler:forms',
  username: 'tabler:fingerprint',
  email: 'tabler:mail',
  password: 'tabler:key',
  saved: 'tabler:circle-check',
  failed: 'tabler:alert-circle',
  signOut: 'tabler:logout',
  sources: 'tabler:books',
  selectAll: 'tabler:checks',
} as const;

/** Статусы подписки из сервиса подписок. */
export const SUBSCRIPTION_STATUS = {
  registered: 'REGISTERED',
  active: 'ACTIVE',
  expired: 'EXPIRED',
} as const;

/** Подписи типов подписки; незнакомый тип не подписывается. */
export const SUBSCRIPTION_TYPE_LABELS: Readonly<Record<string, string>> = {
  GIFT: 'Подарочная',
  BUY: 'Купленная',
};

/** Подписи наград за промокод; незнакомая показывается как есть. */
export const REWARD_PERK_LABELS: Readonly<Record<string, string>> = {
  EARLY_ACCESS_DOWNLOAD: 'Ранний доступ к скачиванию',
  MAP_TOKENS_DOWNLOAD: 'Карты и токены',
  ADVENTURE_DOWNLOAD: 'Приключение',
  DEV_CHAT_ACCESS: 'Приватный чат разработки',
  PROFILE_BADGE: 'Значок профиля',
  AVATAR_FRAME: 'Рамка аватара',
  NICKNAME_COLOR: 'Цвет никнейма',
  PROFILE_ICON: 'Иконки профиля',
  APP_CREDITS: 'Упоминание в титрах приложения',
};

/** Даты подписки: `ДД.ММ.ГГГГ`, как в старом SPA. */
export const SUBSCRIPTION_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

/** Локаль дат подписки. */
export const SUBSCRIPTION_DATE_LOCALE = 'ru-RU';

/** Тексты подписки и промокодов. */
export const SUBSCRIPTION_TEXT = {
  title: 'Подписка',
  loadFailed: 'Не удалось загрузить подписку',
  retry: 'Повторить',
  active: 'Подписка активна',
  activeUntil: 'Действует до',
  expired: 'Подписка истекла',
  expiredAt: 'Закончилась',
  none: 'Активной подписки нет. Введите промокод, чтобы получить подписку и награды.',
  registered: 'Есть неактивированная подписка',
  months: 'мес.',
  activate: 'Активировать',
  activated: 'Подписка активирована',
  activateFailed: 'Не удалось активировать подписку',
  code: 'Промокод',
  codePlaceholder: 'Введите промокод',
  redeem: 'Применить',
  redeemed: 'Промокод успешно активирован!',
  redeemFailed: 'Промокод не найден или уже использован.',
  granted: 'Вы получили',
  subscription: 'Подписка',
  achievements: 'Достижения',
  nothingNew: 'Награды этого кода у вас уже были',
} as const;

/** Ключ данных подписок пользователя. */
export const SUBSCRIPTIONS_DATA_KEY = 'profile-subscriptions';

/** Иконки подписки. */
export const SUBSCRIPTION_ICON = {
  title: 'tabler:crown',
  active: 'tabler:circle-check',
  expired: 'tabler:circle-x',
  none: 'tabler:gift-off',
  registered: 'tabler:clock-pause',
  activate: 'tabler:player-play',
  code: 'tabler:ticket',
  redeem: 'tabler:gift',
  info: 'tabler:info-circle',
} as const;
