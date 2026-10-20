import type { BaseRuleConfig, BaseWithLengthRuleConfig } from './types';
import type { FormItemRule } from 'naive-ui';

export const ruleYoutubeId = (config?: BaseRuleConfig): FormItemRule => {
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
    validator: (rule, value: string) => {
      if (required && !value?.length) {
        return new Error('Поле обязательно для заполнения');
      }

      if (!/([^"&?/\s]{11})/i.test(value)) {
        return new Error('Некорректный ID видео');
      }

      return true;
    },
  };
};

export const ruleYoutubeName = (
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
    validator: (rule, value: string) => {
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

      return true;
    },
  };
};
