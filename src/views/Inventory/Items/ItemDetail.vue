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
  import SectionHeader from '@/components/UI/SectionHeader.vue';
  import errorHandler from '@/common/helpers/errorHandler';
  import ItemBody from '@/views/Inventory/Items/ItemBody.vue';
  import ContentDetail from '@/components/content/ContentDetail.vue';
  import { useUIStore } from '@/store/UI/UIStore';

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

<style lang="scss" scoped>

</style>
