<template>
  <content-detail class="spell-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="spell?.name?.eng || ''"
        :title="spell?.name?.rus || ''"
        bookmark
        print
        :foundry-versions="foundryVersions"
        @close="onClose"
        @export-foundry="exportFoundry"
      />
    </template>

    <template #default>
      <spell-body
        v-if="spell"
        :spell="spell"
      />
    </template>
  </content-detail>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { onBeforeMount, ref } from 'vue';
  import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';

  import SpellBody from '@/pages/character/spells/spells-detail/SpellBody.vue';

  import SectionHeader from '@/features/SectionHeader.vue';

  import { useAxios } from '@/shared/composables/useAxios';
  import { downloadByUrl } from '@/shared/helpers/download';
  import { errorHandler } from '@/shared/helpers/errorHandler';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { TSpellItem } from '@/shared/types/character/Spells';
  import type { Maybe } from '@/shared/types/Utility';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';

  const http = useAxios();
  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile } = storeToRefs(uiStore);
  const foundryVersions: Array<11> = [11];

  const spell = ref<Maybe<TSpellItem>>(undefined);
  const loading = ref(true);
  const error = ref(false);
  const abortController = ref<AbortController | null>(null);

  const exportFoundry = (
    version: number,
    showErrorToast: (msg: string) => void
  ) => {
    if (!spell.value) {
      return Promise.reject();
    }

    return downloadByUrl(
      `/api/v1/fvtt/spell?version=${version}&id=${spell.value.id}`
    ).catch(err => {
      showErrorToast('Этот свиток ещё не подготовлен.');
      Promise.reject(err);
    });
  };

  const spellInfoQuery = async (url: string) => {
    if (abortController.value) {
      abortController.value.abort();
    }

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const resp = await http.post<TSpellItem>({
        url,
        signal: abortController.value.signal
      });

      spell.value = resp.data;
    } catch (err) {
      errorHandler(err);

      error.value = true;
    } finally {
      loading.value = false;
      abortController.value = null;
    }
  };

  const onClose = () => {
    router.push({ name: 'spells' });
  };

  onBeforeMount(async () => {
    await spellInfoQuery(route.path);
  });

  onBeforeRouteUpdate(async (to, _from, next) => {
    await spellInfoQuery(to.path);

    next();
  });
</script>

<style lang="scss" scoped>
  .spell-detail {
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
