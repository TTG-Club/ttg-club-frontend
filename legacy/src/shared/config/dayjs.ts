import dayjs from 'dayjs';
import dayjsLocale from 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

export const configurateDayjs = () => {
  dayjs.locale(dayjsLocale);
  dayjs.extend(localizedFormat);
  dayjs.extend(customParseFormat);
};
