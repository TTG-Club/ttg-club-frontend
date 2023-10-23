<template>
  <content-detail class="creature-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="creature?.name?.eng || ''"
        :title="creature?.name?.rus || ''"
        bookmark
        print
        :foundry-versions="foundryVersions"
        @close="onClose"
        @export-foundry="exportFoundry"
      />
    </template>

    <template #default>
      <creature-body
        v-if="creature"
        :creature="creature"
      />
    </template>
  </content-detail>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { onBeforeMount, ref } from 'vue';
  import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';

  import CreatureBody from '@/pages/Workshop/Bestiary/CreatureBody.vue';

  import SectionHeader from '@/features/SectionHeader.vue';

  import { useAxios } from '@/shared/compositions/useAxios';
  import { downloadByUrl } from '@/shared/helpers/download';
  import { errorHandler } from '@/shared/helpers/errorHandler';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { Maybe } from '@/shared/types/Utility';
  import type { ICreature } from '@/shared/types/Workshop/Bestiary.d';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';

  const http = useAxios();
  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile } = storeToRefs(uiStore);
  const foundryVersions: Array<10 | 11> = [10, 11];

  const creature = ref<Maybe<ICreature>>(undefined);
  const loading = ref(true);
  const error = ref(false);
  const abortController = ref<AbortController | null>(null);

  const exportFoundry = (
    version: number,
    showErrorToast: (msg: string) => void
  ) => {
    if (!creature.value) {
      return Promise.reject();
    }

    try {
      return downloadByUrl(
        `/api/v1/fvtt/bestiary?version=${version}&id=${creature.value.id}`
      );
    } catch (err) {
      showErrorToast(`${creature.value.name.rus} ещё в пути.`);

      return Promise.reject(err);
    }
  };

  const creatureInfoQuery = async (url: string) => {
    if (abortController.value) {
      abortController.value.abort();
    }

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const resp = await http.post<ICreature>({
        url,
        signal: abortController.value.signal
      });

      creature.value = resp.data;
    } catch (err) {
      errorHandler(err);

      error.value = true;
    } finally {
      loading.value = false;
      abortController.value = null;
    }
  };

  const onClose = () => {
    router.push({ name: 'bestiary' });
  };

  onBeforeMount(async () => {
    await creatureInfoQuery(route.path);
  });

  onBeforeRouteUpdate(async (to, _from, next) => {
    await creatureInfoQuery(to.path);

    next();
  });
</script>

<style lang="scss" scoped>
  .creature-detail {
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &__loader {
      width: 100%;
      flex: 1 1 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      &_img {
        width: 70%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        &:before {
          content: '';
          display: block;
          width: 100%;
          padding-bottom: 100%;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: absolute;
          filter: drop-shadow(0 0 12px var(--bg-main));
        }
      }
    }
  }
</style>
