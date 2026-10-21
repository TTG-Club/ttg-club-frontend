import dayjs, { type ConfigType } from 'dayjs';

/**
 * Возвращает форматированную дату. Формат по умолчанию - LL.
 * Документация: https://day.js.org/docs/en/display/format
 *
 * @param date
 * @param format
 */
export const getDateString = (date: ConfigType, format = 'LL'): string => {
  const resolved = dayjs(date);

  if (resolved.isValid()) {
    return resolved.format(format);
  }

  return '';
};
