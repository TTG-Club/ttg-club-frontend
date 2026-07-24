<script lang="ts" setup>
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/shared/config';
  import { useUserStore } from '@/shared/stores/UserStore';
  import { getApiErrorMessage } from '@/shared/utils/apiError';

  import type { FormInst, FormItemRule, FormRules } from 'naive-ui';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const toast = useToast(ToastEventBus);
  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);

  const inProgress = ref(false);
  const formRef = ref<FormInst>();

  /** Ограничения имени совпадают с новым сайтом (2–24, буквы/цифры/пробел/дефис/подчёркивание). */
  const DISPLAY_NAME_MIN = 2;
  const DISPLAY_NAME_MAX = 24;
  const DISPLAY_NAME_PATTERN = /^[\w\p{L}\s-]+$/u;

  // Заранее подставляем текущее имя (или логин, если имя ещё не задано), чтобы
  // пользователь правил, а не вводил с нуля.
  const model = reactive({
    displayName: user.value?.displayName || user.value?.username || '',
  });

  const rules: FormRules = {
    displayName: [
      {
        required: true,
        message: 'Введите имя',
        trigger: ['input', 'blur'],
      },
      {
        validator: (_rule: FormItemRule, value: string) => {
          const trimmed = (value ?? '').trim();

          if (trimmed.length < DISPLAY_NAME_MIN) {
            return new Error(`Минимум ${DISPLAY_NAME_MIN} символа`);
          }

          if (trimmed.length > DISPLAY_NAME_MAX) {
            return new Error(`Максимум ${DISPLAY_NAME_MAX} символа`);
          }

          if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
            return new Error(
              'Только буквы, цифры, пробелы, дефисы и подчёркивания',
            );
          }

          return true;
        },
        trigger: ['input', 'blur'],
      },
    ],
  };

  async function onSubmit() {
    inProgress.value = true;

    try {
      await formRef.value!.validate();
    } catch {
      toast.error('Проверьте правильность заполнения поля');

      inProgress.value = false;

      return;
    }

    try {
      await userStore.changeDisplayName(model.displayName.trim());

      toast.success('Имя обновлено');

      emit('close');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      inProgress.value = false;
    }
  }
</script>

<template>
  <n-form
    ref="formRef"
    :rules="rules"
    :model="model"
    @submit.prevent.stop="onSubmit"
    @keyup.enter.exact.prevent.stop="onSubmit"
  >
    <p class="display-name-hint">
      Это имя увидят другие пользователи в ваших комментариях вместо логина.
    </p>

    <n-form-item path="displayName">
      <n-input
        v-model:value="model.displayName"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        placeholder="Отображаемое имя"
        autofocus
        size="large"
        :maxlength="DISPLAY_NAME_MAX"
        show-count
      />
    </n-form-item>

    <n-button
      :loading="inProgress"
      type="primary"
      size="large"
      @click.left.exact.prevent="onSubmit"
    >
      Сохранить имя
    </n-button>
  </n-form>
</template>

<style lang="scss" scoped>
  .display-name-hint {
    margin: 0 0 16px;
    color: var(--text-g-color);
  }
</style>
