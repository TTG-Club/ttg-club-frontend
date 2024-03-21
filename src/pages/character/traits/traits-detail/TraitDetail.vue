<script>
  import { mapState } from 'pinia';

  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import TraitBody from '@/pages/character/traits/traits-detail/TraitBody.vue';

  export default {
    components: {
      ContentDetail,
      TraitBody,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.traitInfoQuery(to.path);

      next();
    },
    data: () => ({
      trait: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
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
            signal: this.abortController.signal,
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
      },
    },
  };
</script>

<template>
  <content-detail
    class="trait-detail"
    :entity-name="trait ? `${trait.name.rus} (черта)` : undefined"
  >
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
