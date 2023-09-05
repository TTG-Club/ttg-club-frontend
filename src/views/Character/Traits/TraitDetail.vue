<template>
  <content-detail class="trait-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="trait?.name?.eng || ''"
        :title="trait?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <trait-body
        v-if="trait"
        :trait="trait"
      />
    </template>
  </content-detail>
</template>

<script>
  import { mapState } from 'pinia';

  import errorHandler from '@/shared/helpers/errorHandler';

  import ContentDetail from '@/components/content/ContentDetail.vue';
  import SectionHeader from '@/components/UI/SectionHeader.vue';

  import { useUIStore } from '@/store/UI/UIStore';
  import TraitBody from '@/views/Character/Traits/TraitBody.vue';

  export default {
    components: {
      ContentDetail,
      TraitBody,
      SectionHeader
    },
    async beforeRouteUpdate(to, from, next) {
      await this.traitInfoQuery(to.path);

      next();
    },
    data: () => ({
      trait: undefined,
      loading: false,
      error: false,
      abortController: null
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile'])
    },
    async mounted() {
      await this.traitInfoQuery(this.$route.path);
    },
    methods: {
      async traitInfoQuery(url) {
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

          this.trait = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'traits' });
      }
    }
  };
</script>

<style lang="scss" scoped></style>
