<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { DEFAULT_QUERY_BOOKS_INJECT_KEY } from '@/shared/const';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import RaceBody from '@/pages/character/races/races-detail/RaceBody.vue';

  import type { RouteLocationNormalizedLoaded } from 'vue-router';

  type TEmit = {
    (e: 'scroll-to-active'): void;
    (
      e: 'scroll-to-last-active',
      v: RouteLocationNormalizedLoaded['path'],
    ): void;
  };

  const emit = defineEmits<TEmit>();

  const route = useRoute();
  const router = useRouter();

  const race = ref();
  const loading = ref(false);
  const error = ref(false);
  const abortController = ref(new AbortController());

  const queryBooks = computedInject(
    DEFAULT_QUERY_BOOKS_INJECT_KEY,
    (source) => toValue(source),
    [],
  );

  const raceInfoQuery = async (url: string) => {
    if (abortController.value instanceof AbortController) {
      abortController.value.abort();
    }

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const resp = await httpClient.post({
        url,
        payload: {
          filter: {
            book: toValue(queryBooks),
          },
        },
        signal: abortController.value.signal,
      });

      race.value = resp.data;
    } catch (err) {
      errorHandler(err);

      error.value = true;
    } finally {
      loading.value = false;
    }
  };

  const close = () => {
    router.push({ name: 'races' });
  };

  tryOnMounted(async () => {
    await raceInfoQuery(route.path);

    emit('scroll-to-active');
  });

  onBeforeRouteUpdate(async (to, from, next) => {
    await raceInfoQuery(to.path);

    next();
  });

  onBeforeRouteLeave((to, from) => {
    if (to.name !== 'races') {
      return;
    }

    emit('scroll-to-last-active', from.path);
  });

  watch(queryBooks, async () => {
    await raceInfoQuery(route.path);
  });
</script>

<template>
  <content-detail
    class="race-detail"
    :entity-name="race ? `${race.name.rus} (раса)` : undefined"
  >
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :subtitle="race?.name?.eng || ''"
        :title="race?.name?.rus || ''"
        bookmark
        fullscreen
        print
        @close="close"
      />
    </template>

    <template #default>
      <race-body
        v-if="race"
        :race="race"
      />
    </template>
  </content-detail>
</template>
