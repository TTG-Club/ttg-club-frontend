<script lang="ts">
  import { AxiosError } from 'axios';

  import { httpClient } from '@/shared/api';
  import RawContent from '@/shared/ui/RawContent.vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import type { RouteLocationNormalized } from 'vue-router';

  export default defineComponent({
    components: {
      RawContent,
      PageLayout,
    },
    setup() {
      const route = useRoute();
      const router = useRouter();

      const infoPage = ref();
      const error = ref(false);

      const errorHandler = (err: any) => {
        if (err instanceof AxiosError) {
          switch (err.response?.status) {
            case 401:
              router.replace({ name: 'unauthorized' });

              return;

            case 403:
              router.replace({ name: 'forbidden' });

              return;

            case 404:
              router.replace({ name: 'not-found' });

              return;

            default:
              router.replace({ name: 'internal-server' });
          }
        }
      };

      const queryInfoPage = async (to: RouteLocationNormalized) => {
        try {
          const resp = await httpClient.get({ url: to.path });

          if (resp.status !== 200) {
            await router.replace({ name: 'not-found' });

            return;
          }

          infoPage.value = resp.data;
        } catch (err) {
          error.value = true;

          errorHandler(err);
        }
      };

      onBeforeRouteUpdate(async (to) => {
        await queryInfoPage(to);
      });

      tryOnBeforeMount(async () => {
        await queryInfoPage(route);
      });

      return {
        infoPage,
        error,
      };
    },
  });
</script>

<template>
  <page-layout
    use-social-links
    show-separator
  >
    <template #title>
      {{ infoPage?.title || 'Заголовок' }}
    </template>

    <template
      v-if="infoPage?.subtitle"
      #subtitle
    >
      {{ infoPage?.subtitle || '' }}
    </template>

    <template #default>
      <raw-content
        v-if="infoPage?.description"
        :template="infoPage.description"
      />

      <span v-else-if="error">Произошла ошибка</span>

      <span v-else>Загрузка...</span>
    </template>
  </page-layout>
</template>
