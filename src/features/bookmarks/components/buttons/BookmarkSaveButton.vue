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

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';

  import CustomBookmarkButton from '@/features/bookmarks/components/buttons/CustomBookmarkButton.vue';
  import DefaultBookmarkButton from '@/features/bookmarks/components/buttons/DefaultBookmarkButton.vue';

  import { useUserStore } from '@/shared/stores/UserStore';

  withDefaults(
    defineProps<{
      name?: string;
      url?: string;
    }>(),
    {
      name: '',
      url: ''
    }
  );

  const { isAuthenticated } = storeToRefs(useUserStore());
</script>
