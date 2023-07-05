<template>
  <vue-final-modal
    v-model="isShow"
    :class="$style.modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div :class="$style.container">
      <div :class="$style.wrapper">
        <div :class="$style.header">
          <h2 :class="$style.title">
            Новое видео
          </h2>

          <ui-button
            icon="close"
            type="secondary"
            @click.left.exact.prevent="isShow = false"
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
              :error-text="v$.id.$dirty ? v$.id.$errors?.[0]?.$message : ''"
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
              :error-text="v$.name.$dirty ? v$.name.$errors?.[0]?.$message : ''"
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
          <ui-button @click.left.exact.prevent="add">
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

<script setup lang="ts">
  import {
    onBeforeMount, reactive, ref
  } from 'vue';
  import { VueFinalModal } from 'vue-final-modal';
  import { useVModel } from '@vueuse/core';
  import { helpers, required } from '@vuelidate/validators';
  import useVuelidate from '@vuelidate/core';
  import { useToast } from 'vue-toastification';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';
  import { useAxios } from '@/common/composition/useAxios';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import UiInput from '@/components/UI/kit/UiInput.vue';
  import { ToastEventBus } from '@/common/utils/ToastConfig';

  export type TYoutubeVideoCreate = Pick<TYoutubeVideo, 'id' | 'name'>;

  type TProp = {
    modelValue: boolean;
  }

  const props = withDefaults(defineProps<TProp>(), {
    modelValue: false
  });

  type TEmit = {
    (e: 'update:modelValue', v: boolean): void;
    (e: 'added', v: TYoutubeVideo): void;
    (e: 'close'): void;
  }

  const emit = defineEmits<TEmit>();

  const isShow = useVModel(props, 'modelValue', emit);
  const http = useAxios();
  const toast = useToast(ToastEventBus);

  const isLoading = ref(false);

  const video = reactive<TYoutubeVideoCreate>({
    id: '',
    name: ''
  });

  const rules = reactive({
    id: {
      required: helpers.withMessage(
        'Поле обязательно для заполнения',
        required
      ),
      format: helpers.withMessage(
        'Поле заполнено неверно',
        value => (
          /([^"&?/\s]{11})/gi
        ).test(value as string)
      )
    },
    name: {
      required: helpers.withMessage(
        'Поле обязательно для заполнения',
        required
      )
    }
  });

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

      const {
        data, status, statusText
      } = await http.post<TYoutubeVideo>({
        url: '/youtube',
        payload: video
      });

      if (status !== 200) {
        return Promise.reject(statusText);
      }

      emit('added', data);
      close();

      return data;
    } catch (err) {
      return Promise.reject(err);
    } finally {
      isLoading.value = false;
    }
  };

  onBeforeMount(() => {
    clear();
  });
</script>

<style module lang="scss">
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
