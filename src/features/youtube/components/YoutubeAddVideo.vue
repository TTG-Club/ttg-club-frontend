<script setup lang="ts">
  import useVuelidate from '@vuelidate/core';
  import { helpers, required } from '@vuelidate/validators';
  import { useVModel } from '@vueuse/core';
  import { reactive, ref, unref, watch } from 'vue';
  import { VueFinalModal } from 'vue-final-modal';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';

  import { YoutubeApi } from '@/features/youtube/api';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

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

  const isLoading = ref(false);

  const video = reactive<TYoutubeVideoCreate>({
    id: '',
    name: '',
  });

  const rules = {
    id: {
      required: helpers.withMessage(
        'Поле обязательно для заполнения',
        required,
      ),
      format: helpers.withMessage('Поле заполнено неверно', (value) =>
        /([^"&?/\s]{11})/gi.test(value as string),
      ),
    },
    name: {
      required: helpers.withMessage(
        'Поле обязательно для заполнения',
        required,
      ),
    },
  };

  const v$ = useVuelidate(rules, video);

  const clear = () => {
    video.id = '';
    video.name = '';
  };

  const close = () => {
    clear();
    emit('close');

    isShow.value = false;
  };

  const add = async () => {
    if (isLoading.value) {
      return Promise.resolve();
    }

    isLoading.value = true;

    try {
      await v$.value.$reset();

      const result = await v$.value.$validate();

      if (!result) {
        toast.error('Проверьте правильность заполнения полей');

        return Promise.resolve();
      }

      const data = await YoutubeApi.add(video);

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
  <vue-final-modal
    v-model="isShow"
    :class="$style.modal"
    content-transition="vfm-fade"
    esc-to-close
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div :class="$style.container">
      <div :class="$style.wrapper">
        <div :class="$style.header">
          <h2 :class="$style.title">Новое видео</h2>

          <ui-button
            icon="close"
            type="secondary"
            @click.left.exact.prevent="close"
          />
        </div>

        <form
          :class="$style.form"
          @keyup.enter.exact.prevent="add"
          @submit.prevent.stop="add"
        >
          <div :class="$style.row">
            <ui-input
              v-model="v$.id.$model"
              :max-length="11"
              :error-text="
                v$.id.$dirty ? unref(v$.id.$errors?.[0]?.$message) : ''
              "
              :autocomplete="false"
              autocapitalize="off"
              autocorrect="off"
              placeholder="ID"
              required
              @blur="v$.id.$touch()"
              @input="v$.id.$reset()"
            />
          </div>

          <div :class="$style.row">
            <ui-input
              v-model="v$.name.$model"
              :error-text="
                v$.name.$dirty ? unref(v$.name.$errors?.[0]?.$message) : ''
              "
              :autocomplete="false"
              autocapitalize="off"
              autocorrect="off"
              placeholder="Название"
              required
              @blur="v$.name.$touch()"
              @input="v$.name.$reset()"
            />
          </div>
        </form>

        <div :class="$style.controls">
          <ui-button
            :loading="isLoading"
            @click.left.exact.prevent="add"
          >
            Сохранить
          </ui-button>

          <ui-button
            type="secondary"
            @click.left.exact.prevent="close"
          >
            Отменить
          </ui-button>
        </div>
      </div>
    </div>
  </vue-final-modal>
</template>

<style module lang="scss">
  @use '@/assets/styles/variables/breakpoints' as *;

  .modal {
  }

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
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 0;
  }

  .row {
  }

  .controls {
    display: flex;
    align-items: flex-start;
  }
</style>
