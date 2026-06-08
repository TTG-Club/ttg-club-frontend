import { isAxiosError } from 'axios';

export const UNKNOWN_API_ERROR_TEXT = 'Неизвестная ошибка';

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
  errors?: unknown;
};

const getMessageFromValue = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(getMessageFromValue)
      .filter((message): message is string => !!message);

    return messages.length ? messages.join('\n') : null;
  }

  if (value && typeof value === 'object') {
    const messages = Object.values(value)
      .map(getMessageFromValue)
      .filter((message): message is string => !!message);

    return messages.length ? messages.join('\n') : null;
  }

  return null;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = UNKNOWN_API_ERROR_TEXT,
) => {
  if (isAxiosError<ApiErrorPayload | string>(error)) {
    const data = error.response?.data;

    if (typeof data === 'string') {
      return data || fallback;
    }

    const message =
      getMessageFromValue(data?.message) ||
      getMessageFromValue(data?.error) ||
      getMessageFromValue(data?.detail) ||
      getMessageFromValue(data?.errors);

    return message || fallback;
  }

  return fallback;
};
