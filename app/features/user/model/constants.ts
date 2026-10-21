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
