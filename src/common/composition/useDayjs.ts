import _dayjs from 'dayjs';
import dayjsLocale from 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

_dayjs.locale(dayjsLocale);
_dayjs.extend(localizedFormat);
_dayjs.extend(customParseFormat);

export const useDayjs = _dayjs;

export const getDate = (date: _dayjs.ConfigType) => {
  const resolved = useDayjs(date);

  if (resolved.isValid()) {
    return resolved.format('LL');
  }

  return null;
};
