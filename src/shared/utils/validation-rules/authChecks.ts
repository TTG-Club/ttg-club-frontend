import { isAxiosError } from 'axios';
import { omit, uniq } from 'lodash-es';

import { httpClient } from '@/shared/api';
import { errorHandler } from '@/shared/utils/errorHandler';
import { useIsDev } from '@/shared/utils/isDev';

import type {
  BaseRuleConfig,
  BaseWithLengthRuleConfig,
  UsernameOrEmailRuleConfig,
} from './types';
import type { FormItemRule } from 'naive-ui';
import type { MaybeRef } from 'vue';

const isDev = useIsDev();

export const emailRegexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const checkUsernameOrEmailExist = async (
  value: string,
  type: 'username' | 'email',
) => {
  try {
    const { status, statusText } = await httpClient.post({
      url: '/auth/exist',
      payload: {
        [type]: value,
      },
    });

    if (status !== 200 && isDev) {
      errorHandler(statusText);

      return Promise.reject(Error('Неизвестная ошибка'));
    }

    return Promise.resolve();
  } catch (err) {
    let errorText = 'Неизвестная ошибка';

    if (isAxiosError(err)) {
      const resp = err.response;

      if (resp?.status === 409) {
        switch (type) {
          case 'email':
            errorText = 'Этот адрес уже занят';

            break;

          case 'username':
            errorText = 'Это имя пользователя уже занято';

            break;

          default:
            break;
        }
      }
    }

    if (isDev) {
      errorHandler(err);
    }

    return Promise.reject(Error(errorText));
  }
};

const validatorUsername = async (
  value: string,
  config?: Omit<UsernameOrEmailRuleConfig, 'trigger'>,
): Promise<void> => {
  const { required, minLength, maxLength, checkExist } = {
    required: true,
    maxLength: 1000,
    ...config,
  };

  if (required && !value?.length) {
    throw new Error('Поле обязательно для заполнения');
  }

  if (value.length > maxLength) {
    throw new Error(`Не более ${maxLength} символов`);
  }

  if (typeof minLength === 'number' && value.length < minLength) {
    throw new Error(`Не менее ${minLength} символов`);
  }

  if (!value.length) {
    return;
  }

  if (/[^\w\-.]/g.test(value)) {
    throw new Error('Допустимы латинские буквы, 0-9 - _ .');
  }

  if (checkExist) {
    await checkUsernameOrEmailExist(value, 'username');
  }
};

const validatorEmail = async (
  value: string,
  config?: Omit<UsernameOrEmailRuleConfig, 'trigger'>,
): Promise<void> => {
  const { required, minLength, maxLength, checkExist } = {
    required: true,
    maxLength: 1000,
    ...config,
  };

  if (required && !value?.length) {
    throw new Error('Поле обязательно для заполнения');
  }

  if (value.length > maxLength) {
    throw new Error(`Не более ${maxLength} символов`);
  }

  if (typeof minLength === 'number' && value.length < minLength) {
    throw new Error(`Не менее ${minLength} символов`);
  }

  if (!value.length) {
    return;
  }

  if (!emailRegexp.test(value)) {
    throw new Error('Недопустимый формат адреса');
  }

  if (checkExist) {
    await checkUsernameOrEmailExist(value, 'email');
  }
};

export const ruleUsername = (
  config?: UsernameOrEmailRuleConfig,
): FormItemRule => {
  const options = {
    required: true,
    trigger: ['change'],
    maxLength: 1000,
    ...config,
  };

  const { required, trigger } = options;

  return {
    required,
    trigger,
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: FormItemRule, value: string) =>
      validatorUsername(value, omit(options, 'trigger')),
  };
};

export const ruleEmail = (config?: UsernameOrEmailRuleConfig): FormItemRule => {
  const options = {
    required: true,
    trigger: ['change'],
    maxLength: 1000,
    ...config,
  };

  const { required, trigger } = options;

  return {
    required,
    trigger,
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: FormItemRule, value: string) =>
      validatorEmail(value, omit(options, 'trigger')),
  };
};

export const ruleUsernameOrEmail = (
  config?: UsernameOrEmailRuleConfig,
): FormItemRule => {
  const options = {
    required: true,
    trigger: ['change'],
    maxLength: 1000,
    ...config,
  };

  const { required, trigger } = options;

  return {
    required,
    trigger,
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: FormItemRule, value: string) =>
      new Promise((resolve, reject) => {
        validatorUsername(value, omit(options, 'trigger'))
          .then(() => resolve())
          .catch((userNameError) =>
            validatorEmail(value, omit(options, 'trigger'))
              .then(() => resolve())
              .catch((err) =>
                reject(/^[\wA-z.+-]+@/g.test(value) ? err : userNameError),
              ),
          );
      }),
  };
};

export const rulePassword = (
  config?: BaseWithLengthRuleConfig,
): FormItemRule => {
  const { required, trigger, minLength, maxLength } = {
    required: true,
    trigger: ['change'],
    maxLength: 1000,
    ...config,
  };

  return {
    required,
    trigger,
    type: 'string',
    transform: (value: string) => value.trim(),
    validator(rule: FormItemRule, value: string) {
      if (required && !value?.length) {
        return new Error('Поле обязательно для заполнения');
      }

      if (value.length > maxLength) {
        return new Error(`Не более ${maxLength} символов`);
      }

      if (typeof minLength === 'number' && value.length < minLength) {
        return new Error(`Не менее ${minLength} символов`);
      }

      if (!value.length) {
        return true;
      }

      if (/[^\w'\-!"#$%&()*,./:;?@[\]^_`{|}~+<=>]+/g.test(value)) {
        const match = value.match(/[^\w'\-!"#$%&()*,./:;?@[\]^_`{|}~+<=>]+/g);
        const matched = match?.flatMap((str) => str.split(''));
        const list = uniq(matched);
        const baseMsg = 'Недопустимые символы';

        if (!list?.length) {
          return new Error(baseMsg);
        }

        const visible = list.slice(0, 3).join(', ');
        const other = list.slice(3);

        return new Error(
          `${baseMsg}: ${visible}${!other.length ? '' : `, +${other.length} др.`}`,
        );
      }

      if (!/[a-z]+/g.test(value)) {
        return new Error('Хотя бы одна буква в нижнем регистре');
      }

      if (!/[A-Z]+/g.test(value)) {
        return new Error('Хотя бы одна буква в верхнем регистре');
      }

      if (!/\d+/g.test(value)) {
        return new Error('Хотя бы одна цифра');
      }

      if (!/['\-!"#$%&()*,./:;?@[\]^_`{|}~+<=>]+/g.test(value)) {
        return new Error('Хотя бы один спец. символ');
      }

      return true;
    },
  };
};

export const rulePasswordRepeat = (
  password: MaybeRef<string>,
  config?: BaseRuleConfig,
): FormItemRule => {
  const { required, trigger }: typeof config = {
    required: true,
    trigger: ['change'],
    ...config,
  };

  return {
    required,
    trigger,
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: FormItemRule, value: string) => {
      if (required && !value?.length) {
        return new Error('Поле обязательно для заполнения');
      }

      if (value !== unref(password)) {
        return new Error('Пароли не совпадают');
      }

      return true;
    },
  };
};
