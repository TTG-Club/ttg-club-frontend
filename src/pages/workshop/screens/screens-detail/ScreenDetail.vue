<script>
  import { mapState } from 'pinia';

  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import ScreenBody from '@/pages/workshop/screens/screens-detail/ScreenBody.vue';
  import ScreensGroup from '@/pages/workshop/screens/screens-detail/ScreensGroup.vue';

  export default {
    components: {
      ScreensGroup,
      ScreenBody,
      ContentDetail,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.screenInfoQuery(to.path);

      next();
    },
    data: () => ({
      screen: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
    },
    async mounted() {
      await this.screenInfoQuery(this.$route.path);
    },
    methods: {
      async screenInfoQuery(url) {
        if (this.abortController) {
          this.abortController.abort();
        }

        try {
          this.error = false;
          this.loading = true;
          this.abortController = new AbortController();

          const resp = await this.$http.post({
            url,
            signal: this.abortController.signal,
          });

          this.screen = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'screens' });
      },
    },
  };
</script>

<template>
  <content-detail
    class="screen-detail"
    :entity-name="screen?.name.rus"
  >
    <template #fixed>
      <section-header
        :copy="!error && !loading"
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
    </template>
  </content-detail>
</template>

<style lang="scss" scoped>
  .screen-detail {
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
