import _dayjs from 'dayjs';
import dayjsLocale from 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

_dayjs.locale(dayjsLocale);
_dayjs.extend(localizedFormat);
_dayjs.extend(customParseFormat);

export const useDayjs = _dayjs;

/**
 * Возвращает форматированную дату. Формат по умолчанию - LL.
 * Документация: https://day.js.org/docs/en/display/format
 *
 * @param date
 * @param format
 */
export const getFormattedDate = (date: _dayjs.ConfigType, format = 'LL') => {
  const resolved = useDayjs(date);

  if (resolved.isValid()) {
    return resolved.format(format);
  }

  return null;
};
