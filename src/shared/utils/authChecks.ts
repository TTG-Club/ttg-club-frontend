import {
  email,
  helpers,
  maxLength,
  minLength,
  required
} from '@vuelidate/validators';

import { useAxios } from '@/shared/composables/useAxios';
import { errorHandler } from '@/shared/utils/errorHandler';
import { useIsDev } from '@/shared/utils/isDev';

const http = useAxios();
const isDev = useIsDev();

const checkExist = async (value: string, type: 'username' | 'email') => {
  try {
    const resp = await http.post({
      url: '/auth/exist',
      payload: {
        [type]: value
      }
    });

    if (resp.status !== 200 && isDev) {
      errorHandler(resp.statusText);
    }

    return Promise.resolve();
  } catch (err) {
    // @ts-ignore
    const resp = err.response;

    if (resp.status === 409) {
      return Promise.reject();
    }

    if (isDev) {
      errorHandler(err);
    }

    return Promise.resolve();
  }
};

export const validateRequired = () =>
  helpers.withMessage('Поле обязательно для заполнения', required);

export const validateUsernameSpecialChars = () =>
  helpers.withMessage(
    'Допустимы латинские буквы, 0-9 - _ .',
    value => !/[^\w\-.]/g.test(value as string)
  );

export const validateUsernameExist = () =>
  helpers.withMessage(
    'Это имя пользователя уже занято',
    helpers.withAsync(async (value: string) => {
      try {
        await checkExist(value, 'username');

        return true;
      } catch (err) {
        return false;
      }
    })
  );

export const validateEmailFormat = () =>
  helpers.withMessage('Неверный электронный адрес', email);

export const validateEmailExist = () =>
  helpers.withMessage(
    'Этот адрес уже занят',
    helpers.withAsync(async (value: string) => {
      try {
        await checkExist(value, 'email');

        return true;
      } catch (err) {
        return false;
      }
    })
  );

export const validatePwdLowerCase = () =>
  helpers.withMessage('Хотя бы одна буква в нижнем регистре', value =>
    /[a-z]+/g.test(value as string)
  );

export const validatePwdUpperCase = () =>
  helpers.withMessage('Хотя бы одна буква в верхнем регистре', value =>
    /[A-Z]+/g.test(value as string)
  );

export const validatePwdNumber = () =>
  helpers.withMessage('Хотя бы одна цифра', value =>
    /\d+/g.test(value as string)
  );

export const validatePwdSpecial = () =>
  helpers.withMessage(
    'Допустимые спец. символы: ! @ # $ % ^ & * _ -',
    value => !/[^\w\-!@#$%^&*]+/g.test(value as string)
  );

export const validateMinLength = (number: number) =>
  helpers.withMessage(
    ({ $params }) => `Не менее ${$params.min} символов`,
    minLength(number)
  );

export const validateMaxLength = (number: number) =>
  helpers.withMessage(
    ({ $params }) => `Не более ${$params.max} символов`,
    maxLength(number)
  );

export default {
  validateRequired,
  validateUsernameSpecialChars,
  validateUsernameExist,
  validateEmailFormat,
  validateEmailExist,
  validatePwdLowerCase,
  validatePwdUpperCase,
  validatePwdNumber,
  validatePwdSpecial,
  validateMinLength,
  validateMaxLength
};
