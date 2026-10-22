/** Подпись кнопки входа на боковой панели. */
export const SIGN_IN_BUTTON_LABEL = 'Войти';

/** Подпись кнопки меню вошедшего пользователя. */
export const USER_MENU_BUTTON_LABEL = 'Профиль';

/** Иконка шлема гостя. */
export const GUEST_HELMET_ICON = 'ttg:profile-helmet-outline';

/** Иконка шлема вошедшего пользователя. */
export const USER_HELMET_ICON = 'ttg:profile-helmet-filled';

/**
 * Пункты меню пользователя, которые ведут в ещё не перенесённые разделы
 * старого SPA и открываются с перезагрузкой страницы.
 */
export const USER_MENU_LEGACY_LINKS = [
  { label: 'Личный кабинет', url: '/profile', icon: 'tabler:user-cog' },
  { label: 'Мастерская', url: '/workshop', icon: 'tabler:tools' },
] as const;

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
