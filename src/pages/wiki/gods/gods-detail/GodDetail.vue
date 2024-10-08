<script>
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import GodBody from '@/pages/wiki/gods/gods-detail/GodBody.vue';

  export default {
    components: {
      ContentDetail,
      GodBody,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.godInfoQuery(to.path);

      next();
    },
    data: () => ({
      god: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
    },
    async mounted() {
      await this.godInfoQuery(this.$route.path);
    },
    methods: {
      async godInfoQuery(url) {
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

          this.god = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'gods' });
      },
    },
  };
</script>

<template>
  <content-detail class="god-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="god?.name?.eng || ''"
        :title="god?.name?.rus || ''"
        bookmark
        @close="close"
      />
    </template>

    <template #default>
      <god-body
        v-if="god"
        :god="god"
      />
    </template>
  </content-detail>
</template>

<style lang="scss" scoped>
  .god-detail {
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
