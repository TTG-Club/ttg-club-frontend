<template>
  <content-detail class="item-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="item?.name?.eng || ''"
        :title="item?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <item-body
        v-if="item"
        :item="item"
      />
    </template>
  </content-detail>
</template>

<script>
  import { mapState } from 'pinia';

  import ItemBody from '@/pages/inventory/items/items-detail/ItemBody.vue';

  import SectionHeader from '@/features/SectionHeader.vue';

  import { errorHandler } from '@/shared/helpers/errorHandler';
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';

  export default {
    components: {
      ContentDetail,
      ItemBody,
      SectionHeader
    },
    async beforeRouteUpdate(to, from, next) {
      await this.itemInfoQuery(to.path);

      next();
    },
    data: () => ({
      item: undefined,
      loading: false,
      error: false,
      abortController: null
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile'])
    },
    async mounted() {
      await this.itemInfoQuery(this.$route.path);
    },
    methods: {
      async itemInfoQuery(url) {
        if (this.abortController) {
          this.abortController.abort();
        }

        try {
          this.error = false;
          this.loading = true;
          this.abortController = new AbortController();

          const resp = await this.$http.post({
            url,
            signal: this.abortController.signal
          });

          this.item = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'items' });
      }
    }
  };
</script>

<style lang="scss" scoped></style>
