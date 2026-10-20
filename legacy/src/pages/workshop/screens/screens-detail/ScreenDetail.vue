<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { useUserStore } from '@/shared/stores/UserStore';
  import type { Maybe } from '@/shared/types/Utility';
  import type { IScreenDetail } from '@/shared/types/workshop/Screens';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import { CommentsBlock } from '@/features/comments';
  import SectionHeader from '@/features/SectionHeader.vue';

  import ScreenBody from '@/pages/workshop/screens/screens-detail/ScreenBody.vue';
  import ScreensGroup from '@/pages/workshop/screens/screens-detail/ScreensGroup.vue';

  const route = useRoute();
  const router = useRouter();
  const { isMobile } = storeToRefs(useUIStore());
  const { isEditor } = storeToRefs(useUserStore());

  const screen = ref<Maybe<IScreenDetail>>(undefined);
  const loading = ref(false);
  const error = ref(false);
  const abortController = ref<AbortController | null>(null);

  const editUrl = computed(() =>
    isEditor.value && screen.value
      ? `/workshop/screens/${route.params.screenName}/edit`
      : '',
  );

  const screenInfoQuery = async (url: string) => {
    abortController.value?.abort();

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const response = await httpClient.post<IScreenDetail>({
        url,
        signal: abortController.value.signal,
      });

      screen.value = response.data;
    } catch (err) {
      errorHandler(err);
      error.value = true;
    } finally {
      loading.value = false;
      abortController.value = null;
    }
  };

  const close = () => {
    router.push({ name: 'screens' });
  };

  onBeforeRouteUpdate(async (to) => {
    await screenInfoQuery(to.path);
  });

  onMounted(async () => {
    await screenInfoQuery(route.path);
  });
</script>

<template>
  <content-detail
    class="screen-detail"
    :entity-name="screen?.name.rus"
  >
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :edit-url="editUrl"
        :fullscreen="!isMobile"
        :subtitle="screen?.name?.eng || ''"
        :title="screen?.name?.rus || ''"
        bookmark
        @close="close"
      />
    </template>

    <template #default>
      <screens-group
        v-if="screen?.chields?.length"
        :child-list="screen.chields"
        :description="screen?.description || ''"
      />

      <screen-body
        v-else-if="screen"
        :screen="screen"
      />

      <comments-block />
    </template>
  </content-detail>
</template>

<style lang="scss" scoped>
  .screen-detail {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;

    &__loader {
      display: flex;
      flex: 1 1 100%;
      align-items: center;
      justify-content: center;

      width: 100%;

      &_img {
        position: relative;

        display: flex;
        align-items: center;
        justify-content: center;

        width: 70%;

        &:before {
          content: '';
          display: block;
          width: 100%;
          padding-bottom: 100%;
        }

        img {
          position: absolute;

          width: 100%;
          height: 100%;

          object-fit: contain;
          filter: drop-shadow(0 0 12px var(--bg-main));
        }
      }
    }
  }
</style>
