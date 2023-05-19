<template>
  <content-detail class="creature-detail">
    <template #fixed>
      <section-header
        :close-on-desktop="fullscreen"
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="creature?.name?.eng || ''"
        :title="creature?.name?.rus || ''"
        bookmark
        print
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

<script lang="ts">
  import { storeToRefs } from 'pinia';
  import {
    defineComponent, onBeforeMount, ref
  } from 'vue';
  import {
    onBeforeRouteUpdate, useRoute, useRouter
  } from 'vue-router';
  import SectionHeader from '@/components/UI/SectionHeader.vue';
  import CreatureBody from '@/views/Workshop/Bestiary/CreatureBody.vue';
  import ContentDetail from '@/components/content/ContentDetail.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import errorHandler from '@/common/helpers/errorHandler';
  import { useAxios } from '@/common/composition/useAxios';
  import type { ICreature } from '@/types/Workshop/Bestiary.types';
  import type { Maybe } from '@/types/Shared/Utility.types';

  export default defineComponent({
    components: {
      ContentDetail,
      CreatureBody,
      SectionHeader
    },
    setup() {
      const http = useAxios();
      const route = useRoute();
      const router = useRouter();
      const uiStore = useUIStore();

      const {
        fullscreen,
        isMobile
      } = storeToRefs(uiStore);

      const creature = ref<Maybe<ICreature>>(undefined);
      const loading = ref(true);
      const error = ref(false);
      const abortController = ref<AbortController | null>(null);

      const exportFoundry = () => {
        if (!creature.value) return;

        window.open(`/api/fvtt/v1/bestiary/${ creature.value.id }`, '_self');
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

      onBeforeRouteUpdate(async (to, from, next) => {
        await creatureInfoQuery(to.path);

        next();
      });

      return {
        creature,
        fullscreen,
        isMobile,
        loading,
        error,
        exportFoundry,
        onClose
      };
    }
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
