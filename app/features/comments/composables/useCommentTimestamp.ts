import type { ComputedRef } from 'vue';

import {
  COMMENT_DATETIME_FORMAT,
  COMMENT_RELATIVE_TIME_HOURS,
  COMMENT_TEXT,
  COMMENT_TIME_LOCALE,
} from '../model';

/** Миллисекунд в минуте: так часто обновляется относительное время. */
const MINUTE_MS = 60 * 1000;

/** Миллисекунд в часе. */
const HOUR_MS = 60 * MINUTE_MS;

/** Даты комментария, нужные подписям времени. */
export interface CommentTimestampSource {
  createdAt: string;
  editedAt?: string | null;
}

/** Возвращаемое значение useCommentTimestamp. */
export interface UseCommentTimestampReturn {
  /** Время создания: относительное для свежих, иначе дата. */
  createdLabel: ComputedRef<string>;

  /** Полные дата и время создания для подсказки. */
  createdFullLabel: ComputedRef<string>;

  /** Подсказка пометки «(изменено)» с датой правки. */
  editedTooltip: ComputedRef<string>;
}

/**
 * Дата из строки сервиса; пустая или битая строка даёт `undefined`.
 * @param value - ISO-строка
 */
function toValidDate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Подписи времени комментария: моложе суток — «7 минут назад», старше —
 * дата и время.
 * @param getComment - геттер дат, чтобы не терять реактивность пропсов
 */
export function useCommentTimestamp(
  getComment: () => CommentTimestampSource,
): UseCommentTimestampReturn {
  const createdDate = computed(() => toValidDate(getComment().createdAt));
  const editedDate = computed(() => toValidDate(getComment().editedAt));

  const createdFormatted = useDateFormat(
    () => createdDate.value ?? '',
    COMMENT_DATETIME_FORMAT,
  );

  const editedFormatted = useDateFormat(
    () => editedDate.value ?? '',
    COMMENT_DATETIME_FORMAT,
  );

  const now = useNow({ interval: MINUTE_MS });

  const createdFullLabel = computed(() =>
    createdDate.value ? createdFormatted.value : '',
  );

  const createdLabel = computed(() => {
    const created = createdDate.value;

    if (!created) {
      return '';
    }

    if (
      now.value.getTime() - created.getTime()
      >= COMMENT_RELATIVE_TIME_HOURS * HOUR_MS
    ) {
      return createdFullLabel.value;
    }

    return formatTimeAgoIntl(
      created,
      { locale: COMMENT_TIME_LOCALE },
      now.value,
    );
  });

  const editedTooltip = computed(() =>
    editedDate.value
      ? `${COMMENT_TEXT.editedPrefix} ${editedFormatted.value}`
      : '',
  );

  return {
    createdLabel,
    createdFullLabel,
    editedTooltip,
  };
}
