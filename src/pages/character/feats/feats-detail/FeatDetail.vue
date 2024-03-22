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
  const { isMobile } = storeToRefs(useUIStore());

  const feat = ref<FeatsItem>();
  const loading = ref(false);
  const error = ref(false);

  let abortController: AbortController | undefined;

  const featInfoQuery = async (url: string) => {
    if (abortController) {
      abortController.abort();
    }

    error.value = false;
    loading.value = true;
    abortController = new AbortController();

    try {
      const resp = await httpClient.post<FeatsItem>({
        url,
        signal: abortController.signal,
      });

      feat.value = resp.data;

      return resp.data;
    } catch (err) {
      error.value = true;

      return err;
    } finally {
      loading.value = false;
      abortController = undefined;
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

  onBeforeRouteUpdate(async (to) => {
    try {
      await featInfoQuery(to.path);

      return to.fullPath;
    } catch (err) {
      errorHandler(err);

      return false;
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
