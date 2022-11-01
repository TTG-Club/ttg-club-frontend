import {
    helpers,
    email,
    required,
    maxLength,
    minLength
} from '@vuelidate/validators';
import errorHandler from '@/common/helpers/errorHandler';
import HTTPService from '@/common/services/HTTPService';

const http = new HTTPService();

const checkExist = async (value, type) => {
    try {
        const resp = await http.post(
            '/auth/exist',
            {
                [type]: value
            }
        );

        if (resp.status !== 200) {
            errorHandler(resp.statusText);
        }

        return Promise.resolve();
    } catch (err) {
        const resp = err.response;

        if (resp.status === 409) {
            return Promise.reject();
        }

        errorHandler(err);

        return Promise.resolve();
    }
};

export const validateRequired = () => helpers.withMessage(
    'Поле обязательно для заполнения',
    required
);

export const validateUsernameSpecialChars = () => helpers.withMessage(
    'Допустимы латинские буквы, 0-9 - _ .',
    value => !(/[^\w\-.]/g).test(value)
);

export const validateUsernameExist = () => helpers.withMessage(
    'Это имя пользователя уже занято',
    helpers.withAsync(async value => {
        try {
            await checkExist(value, 'username');

            return true;
        } catch (err) {
            return false;
        }
    })
);

export const validateEmailFormat = () => helpers.withMessage(
    'Неверный электронный адрес',
    email
);

export const validateEmailExist = () => helpers.withMessage(
    'Этот адрес уже занят',
    helpers.withAsync(async value => {
        try {
            await checkExist(value, 'email');

            return true;
        } catch (err) {
            return false;
        }
    })
);

export const validatePwdLowerCase = () => helpers.withMessage(
    'Хотя бы одна буква в нижнем регистре',
    value => (/[a-z]+/g).test(value)
);

export const validatePwdUpperCase = () => helpers.withMessage(
    'Хотя бы одна буква в верхнем регистре',
    value => (/[A-Z]+/g).test(value)
);

export const validatePwdNumber = () => helpers.withMessage(
    'Хотя бы одна цифра',
    value => (/\d+/g).test(value)
);

export const validatePwdSpecial = () => helpers.withMessage(
    'Допустимые спец. символы: ! @ # $ % ^ & * _',
    value => !(/[^\w!@#$%^&*]+/g).test(value)
);

export const validateMinLength = number => helpers.withMessage(
    ({ $params }) => `Не менее ${ $params.min } символов`,
    minLength(number)
);

export const validateMaxLength = number => helpers.withMessage(
    ({ $params }) => `Не более ${ $params.max } символов`,
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
