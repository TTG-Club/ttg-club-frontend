<script>
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import MagicItemBody from '@/pages/inventory/magic-items/magic-items-detail/MagicItemBody.vue';

  export default {
    components: {
      ContentDetail,
      MagicItemBody,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.magicItemInfoQuery(to.path);

      next();
    },
    data: () => ({
      magicItem: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
    },
    async mounted() {
      await this.magicItemInfoQuery(this.$route.path);
    },
    methods: {
      async magicItemInfoQuery(url) {
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

          this.magicItem = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'magicItems' });
      },
    },
  };
</script>

<template>
  <content-detail
    class="magic-item-detail"
    :entity-name="magicItem?.name.rus"
  >
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="magicItem?.name?.eng || ''"
        :title="magicItem?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <magic-item-body
        v-if="magicItem"
        :magic-item="magicItem"
      />
    </template>
  </content-detail>
</template>

<style lang="scss" scoped>
  .magic-item-detail {
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
