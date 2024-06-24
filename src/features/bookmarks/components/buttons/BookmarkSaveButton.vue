<script lang="ts" setup>
  import { useUserStore } from '@/shared/stores/UserStore';

  import CustomBookmarkButton from './CustomBookmarkButton.vue';
  import DefaultBookmarkButton from './DefaultBookmarkButton.vue';

  withDefaults(
    defineProps<{
      name?: string;
      url?: string;
    }>(),
    {
      name: '',
      url: '',
    },
  );

  const { isAuthenticated } = storeToRefs(useUserStore());
</script>

<template>
  <custom-bookmark-button
    v-if="isAuthenticated"
    v-bind="$props"
  />

  <default-bookmark-button
    v-else
    v-bind="$props"
  />
</template>
