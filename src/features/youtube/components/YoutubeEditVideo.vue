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
          <h2 :class="$style.title">Изменение видео</h2>

          <ui-button
            icon="close"
            type="secondary"
            @click.left.exact.prevent="close"
          />
        </div>

        <form
          :class="$style.form"
          @keyup.enter.exact.prevent="save"
          @submit.prevent.stop="save"
        >
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
          <ui-button
            :loading="isLoading"
            @click.left.exact.prevent="save"
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

<script lang="ts" setup>
  import useVuelidate from '@vuelidate/core';
  import { helpers, required } from '@vuelidate/validators';
  import { useVModel } from '@vueuse/core';
  import { cloneDeep } from 'lodash-es';
  import { ref, watch, reactive } from 'vue';
  import { VueFinalModal } from 'vue-final-modal';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { YoutubeApi } from '@/features/youtube/api';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';

  type TProp = {
    modelValue: boolean;
    video: TYoutubeVideo;
  };

  const props = withDefaults(defineProps<TProp>(), {
    modelValue: false
  });

  type TEmit = {
    (e: 'update:modelValue', v: boolean): void;
    (e: 'saved', v: TYoutubeVideo): void;
    (e: 'close'): void;
  };

  const emit = defineEmits<TEmit>();

  const isShow = useVModel(props, 'modelValue', emit);
  const toast = useToast(ToastEventBus);

  const isLoading = ref(false);
  const state = reactive(cloneDeep(props.video));

  const rules = {
    name: {
      required: helpers.withMessage('Поле обязательно для заполнения', required)
    }
  };

  const v$ = useVuelidate(rules, state);

  const reset = () => {
    Object.assign(state, cloneDeep(props.video));
  };

  const close = () => {
    reset();
    emit('close');

    isShow.value = false;
  };

  const save = async () => {
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

      const data = await YoutubeApi.edit(state);

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
    }
  );
</script>

<style lang="scss" module>
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
