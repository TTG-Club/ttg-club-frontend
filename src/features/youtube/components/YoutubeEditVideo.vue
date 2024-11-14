<script lang="ts" setup>
  import { cloneDeep } from 'lodash-es';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/shared/config';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { ruleYoutubeName } from '@/shared/utils/validation-rules';

  import { YoutubeApi } from '@/features/youtube/api';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  import type { FormInst } from 'naive-ui';

  type TProp = {
    modelValue: boolean;
    video: TYoutubeVideo;
  };

  const props = withDefaults(defineProps<TProp>(), {
    modelValue: false,
  });

  type TEmit = {
    (e: 'update:modelValue', v: boolean): void;
    (e: 'saved', v: TYoutubeVideo): void;
    (e: 'close'): void;
  };

  const emit = defineEmits<TEmit>();

  const isShow = useVModel(props, 'modelValue', emit);
  const toast = useToast(ToastEventBus);
  const formRef = ref<FormInst>();

  const isLoading = ref(false);
  const model = reactive(cloneDeep(props.video));

  const rules = reactive({
    name: ruleYoutubeName(),
  });

  const reset = () => {
    Object.assign(model, cloneDeep(props.video));
  };

  const close = () => {
    reset();
    emit('close');

    isShow.value = false;
  };

  const validate = () => formRef.value!.validate();

  const save = async () => {
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
      const data = await YoutubeApi.edit(model);

      emit('saved', data);
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
      reset();
    },
  );
</script>

<template>
  <n-modal v-model:show="isShow">
    <div :class="$style.container">
      <div :class="$style.wrapper">
        <div :class="$style.header">
          <h2 :class="$style.title">Изменение видео</h2>

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
          @keyup.enter.exact.prevent.stop="save"
          @submit.prevent.stop="save"
        >
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
              @click.left.exact.prevent="save"
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

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;

  .container {
    overflow: hidden;
    display: flex;

    width: 100%;
    max-width: 500px;
    max-height: calc(var(--max-vh) / 100 * 90);
    margin: auto;

    background-color: var(--bg-secondary);
    box-shadow: var(--n-box-shadow);

    @include media-min($sm) {
      border-radius: 8px;
    }
  }

  .wrapper {
    pointer-events: auto;

    overflow: hidden;

    width: 100%;
    padding: 24px;

    background: var(--bg-secondary);
    border-radius: 12px;
    box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
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
