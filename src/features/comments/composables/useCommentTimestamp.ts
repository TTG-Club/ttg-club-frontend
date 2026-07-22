import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getDateString } from '@/shared/utils/getDateString';

import { COMMENT_DATETIME_FORMAT } from '../model';

import type { PublicComment } from '../model';
import type { ComputedRef } from 'vue';

/**
 * Плагин относительного времени подключается здесь, а не в бутстрапе
 * приложения: `configurateDayjs` из `@/shared/config` в проекте не вызывается,
 * поэтому расчёт на глобальную настройку молча ронял бы `fromNow` на рендере.
 * Повторный `extend` безопасен — dayjs игнорирует уже подключённый плагин.
 */
dayjs.extend(relativeTime);

/** Начиная с этого возраста время показывается абсолютной датой (часы). */
const RELATIVE_TIME_LIMIT_HOURS = 24;

/** Возвращаемое значение композабла useCommentTimestamp. */
export interface UseCommentTimestampReturn {
  /** Подпись времени создания: относительная либо абсолютная. */
  createdLabel: ComputedRef<string>;

  /** Абсолютные дата и время создания (подсказка и старые комментарии). */
  createdFullLabel: ComputedRef<string>;

  /** Подсказка пометки «(изменено)» с полной датой правки. */
  editedTooltip: ComputedRef<string>;
}

/**
 * Подписи времени комментария: свежие (до суток) подписываются относительно
 * («7 минут назад»), старше — абсолютной датой и временем; полная дата
 * используется в подсказках.
 *
 * @param getComment Геттер комментария (сохраняет реактивность пропсов).
 */
export function useCommentTimestamp(
  getComment: () => PublicComment,
): UseCommentTimestampReturn {
  const createdFullLabel = computed(() => {
    const { createdAt } = getComment();

    return createdAt ? getDateString(createdAt, COMMENT_DATETIME_FORMAT) : '';
  });

  const createdLabel = computed(() => {
    const { createdAt } = getComment();

    if (!createdAt) {
      return '';
    }

    const created = dayjs(createdAt);

    if (!created.isValid()) {
      return '';
    }

    if (dayjs().diff(created, 'hour') >= RELATIVE_TIME_LIMIT_HOURS) {
      return createdFullLabel.value;
    }

    return created.fromNow();
  });

  const editedTooltip = computed(() => {
    const { editedAt } = getComment();

    return editedAt
      ? `Изменено ${getDateString(editedAt, COMMENT_DATETIME_FORMAT)}`
      : '';
  });

  return {
    createdLabel,
    createdFullLabel,
    editedTooltip,
  };
}
