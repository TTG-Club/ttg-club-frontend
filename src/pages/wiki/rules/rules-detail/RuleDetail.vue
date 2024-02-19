<script>
  import { mapState } from 'pinia';

  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import RuleBody from '@/pages/wiki/rules/rules-detail/RuleBody.vue';

  export default {
    components: {
      ContentDetail,
      RuleBody,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.ruleInfoQuery(to.path);

      next();
    },
    data: () => ({
      rule: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
    },
    async mounted() {
      await this.ruleInfoQuery(this.$route.path);
    },
    methods: {
      async ruleInfoQuery(url) {
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

          this.rule = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'rules' });
      },
    },
  };
</script>

<template>
  <content-detail class="rule-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="rule?.name?.eng || ''"
        :title="rule?.name?.rus || ''"
        bookmark
        @close="close"
      />
    </template>

    <template #default>
      <rule-body
        v-if="rule"
        :rule="rule"
      />
    </template>
  </content-detail>
</template>
