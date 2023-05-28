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

<script>
  import { mapState } from 'pinia';
  import SectionHeader from '@/components/UI/SectionHeader.vue';
  import errorHandler from '@/common/helpers/errorHandler';
  import RuleBody from '@/views/Wiki/Rules/RuleBody.vue';
  import ContentDetail from '@/components/content/ContentDetail.vue';
  import { useUIStore } from '@/store/UI/UIStore';

  export default {
    components: {
      ContentDetail,
      RuleBody,
      SectionHeader
    },
    async beforeRouteUpdate(to, from, next) {
      await this.ruleInfoQuery(to.path);

      next();
    },
    data: () => ({
      rule: undefined,
      loading: false,
      error: false,
      abortController: null
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile'])
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
            signal: this.abortController.signal
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
      }
    }
  };
</script>

<style lang="scss" scoped>

</style>
