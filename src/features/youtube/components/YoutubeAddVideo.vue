<script setup lang="ts">
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/shared/config';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import {
    ruleYoutubeId,
    ruleYoutubeName,
  } from '@/shared/utils/validation-rules';

  import { YoutubeApi } from '@/features/youtube/api';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  import type { FormInst } from 'naive-ui';

  export type TYoutubeVideoCreate = Pick<TYoutubeVideo, 'id' | 'name'>;

  type TProp = {
    modelValue: boolean;
  };

  const props = withDefaults(defineProps<TProp>(), {
    modelValue: false,
  });

  type TEmit = {
    (e: 'update:modelValue', v: boolean): void;
    (e: 'added', v: TYoutubeVideo): void;
    (e: 'close'): void;
  };

  const emit = defineEmits<TEmit>();

  const isShow = useVModel(props, 'modelValue', emit);
  const toast = useToast(ToastEventBus);
  const formRef = ref<FormInst>();

  const isLoading = ref(false);

  const model = reactive<TYoutubeVideoCreate>({
    id: '',
    name: '',
  });

  const rules = reactive({
    id: ruleYoutubeId(),
    name: ruleYoutubeName(),
  });

  const clear = () => {
    model.id = '';
    model.name = '';
  };

  const close = () => {
    clear();
    emit('close');

    isShow.value = false;
  };

  const validate = () => formRef.value!.validate();

  const add = async () => {
    if (isLoading.value) {
      return Promise.resolve();
    }

    isLoading.value = true;

    try {
      await validate();
    } catch (err) {
      toast.error('Проверьте правильность заполнения полей');

      isLoading.value = false;

      return Promise.reject(err);
    }

    try {
      const data = await YoutubeApi.add(model);

      emit('added', data);
      close();

      return data;
    } catch (err) {
      return Promise.reject(err);
    } finally {
      isLoading.value = false;
    }
  };

  watch(
    () => props.modelValue,
    () => {
      clear();
    },
  );
</script>

<template>
  <n-modal v-model:show="isShow">
    <div :class="$style.container">
      <div :class="$style.wrapper">
        <div :class="$style.header">
          <h2 :class="$style.title">Новое видео</h2>

          <n-button
            secondary
            @click.left.exact.prevent="close"
          >
            <template #icon>
              <svg-icon icon="close" />
            </template>
          </n-button>
        </div>

        <n-form
          ref="formRef"
          :rules
          :model
          :class="$style.form"
          @submit.prevent.stop="add"
          @keyup.enter.exact.prevent.stop="add"
        >
          <n-form-item
            path="id"
            label="ID видео"
          >
            <n-input
              v-model:value.trim="model.id"
              :maxlength="11"
              :minlength="11"
              :autocomplete="false"
              autocapitalize="off"
              autocorrect="off"
              placeholder="ID"
              autofocus
            />
          </n-form-item>

          <n-form-item
            path="name"
            label="Название видео"
          >
            <n-input
              v-model:value.trim="model.name"
              :autocomplete="false"
              autocapitalize="off"
              autocorrect="off"
              placeholder="Название"
            />
          </n-form-item>

          <n-flex :wrap="false">
            <n-button
              :loading="isLoading"
              type="primary"
              attr-type="submit"
            >
              Сохранить
            </n-button>

            <n-button
              secondary
              @click.left.exact.prevent="close"
            >
              Отменить
            </n-button>
          </n-flex>
        </n-form>
      </div>
    </div>
  </n-modal>
</template>

<style module lang="scss">
  @use '@/assets/styles/variables/breakpoints' as *;

  .container {
    background-color: var(--bg-secondary);
    max-height: calc(var(--max-vh) / 100 * 90);
    margin: auto;
    overflow: hidden;
    box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
    display: flex;
    width: 100%;
    max-width: 500px;

    @include media-min($sm) {
      border-radius: 8px;
    }
  }

  .wrapper {
    background: var(--bg-secondary);
    overflow: hidden;
    border-radius: 12px;
    width: 100%;
    pointer-events: auto;
    box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
    padding: 24px;
  }

  .header {
    display: flex;
    align-items: center;
  }

  .title {
    margin-right: auto;
  }

  .form {
    padding: 24px 0 0;
  }
</style>
