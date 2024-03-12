<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { onBeforeMount, ref } from 'vue';
  import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';

  import { httpClient } from '@/shared/api';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { FeatsItem } from '@/shared/types/character/Feats';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import FeatBody from './FeatBody.vue';

  const route = useRoute();
  const router = useRouter();

  const feat = ref<FeatsItem>();
  const loading = ref(false);
  const error = ref(false);
  const abortController = ref<AbortController>();

  const { isMobile } = storeToRefs(useUIStore());

  const featInfoQuery = async (url: string) => {
    if (abortController.value) {
      abortController.value.abort();
    }

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const resp = await httpClient.post<FeatsItem>({
        url,
        signal: abortController.value.signal,
      });

      feat.value = resp.data;

      return resp.data;
    } catch (err) {
      error.value = true;

      return err;
    } finally {
      loading.value = false;
      abortController.value = undefined;
    }
  };

  const close = () => router.push({ name: 'feats' });

  onBeforeMount(async () => {
    try {
      await featInfoQuery(route.path);
    } catch (err) {
      errorHandler(err);
    }
  });

  onBeforeRouteUpdate(async (to, from, next) => {
    try {
      await featInfoQuery(to.path);

      next();
    } catch (err) {
      errorHandler(err);
    }
  });
</script>

<template>
  <content-detail class="feat-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="feat?.name?.eng || ''"
        :title="feat?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <feat-body
        v-if="feat"
        :feat="feat"
      />
    </template>
  </content-detail>
</template>
