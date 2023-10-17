<template>
  <content-detail class="background-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="background?.name?.eng || ''"
        :title="background?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <background-body
        v-if="background"
        :background="background"
      />
    </template>
  </content-detail>
</template>

<script>
  import { mapState } from 'pinia';

  import BackgroundBody from '@/pages/Character/Backgrounds/BackgroundBody.vue';

  import SectionHeader from '@/features/SectionHeader.vue';

  import { errorHandler } from '@/shared/helpers/errorHandler';
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';

  export default {
    components: {
      ContentDetail,
      BackgroundBody,
      SectionHeader
    },
    async beforeRouteUpdate(to, from, next) {
      await this.backgroundInfoQuery(to.path);

      next();
    },
    data: () => ({
      background: undefined,
      loading: false,
      error: false,
      abortController: null
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile'])
    },
    async mounted() {
      await this.backgroundInfoQuery(this.$route.path);
    },
    methods: {
      async backgroundInfoQuery(url) {
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

          this.background = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'backgrounds' });
      }
    }
  };
</script>

<style lang="scss" scoped></style>
