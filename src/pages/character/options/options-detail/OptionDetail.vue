<script>
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import OptionBody from '@/pages/character/options/options-detail/OptionBody.vue';

  export default {
    components: {
      ContentDetail,
      OptionBody,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.optionInfoQuery(to.path);

      next();
    },
    data: () => ({
      option: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
    },
    async mounted() {
      await this.optionInfoQuery(this.$route.path);
    },
    methods: {
      async optionInfoQuery(url) {
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

          this.option = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'options' });
      },
    },
  };
</script>

<template>
  <content-detail
    class="option-detail"
    :entity-name="
      option ? `${option.name.rus} (особенность классов)` : undefined
    "
  >
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="option?.name?.eng || ''"
        :title="option?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <option-body
        v-if="option"
        :option="option"
      />
    </template>
  </content-detail>
</template>
