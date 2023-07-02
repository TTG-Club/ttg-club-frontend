<template>
  <base-modal
    :model-value="isShow"
    @close="$emit('close')"
  >
    <template #footer>
      <ui-button>Сохранить</ui-button>

      <ui-button>Отменить</ui-button>
    </template>
  </base-modal>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import BaseModal from '@/components/UI/modals/BaseModal.vue';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';

  type TProps = {
    video?: TYoutubeVideo;
  };

  type TEmit = {
    (e: 'saved'): void;
    (e: 'close'): void;
  }

  const props = defineProps<TProps>();
  const emit = defineEmits<TEmit>();

  const isShow = computed(() => !!props.video);
</script>

<style module lang="scss">

</style>
