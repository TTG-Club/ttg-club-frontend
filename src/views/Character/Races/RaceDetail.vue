<template>
  <content-detail class="race-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :subtitle="race?.name?.eng || ''"
        :title="race?.name?.rus || ''"
        bookmark
        fullscreen
        print
        @close="close"
      />
    </template>

    <template #default>
      <race-body
        v-if="race"
        :race="race"
      />
    </template>
  </content-detail>
</template>

<script>
  import { mapState } from 'pinia';
  import {
    computedInject, toValue
  } from '@vueuse/core';
  import SectionHeader from '@/components/UI/SectionHeader.vue';
  import errorHandler from '@/common/helpers/errorHandler';
  import RaceBody from '@/views/Character/Races/RaceBody.vue';
  import ContentDetail from '@/components/content/ContentDetail.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { DEFAULT_QUERY_BOOKS_INJECT_KEY } from '@/common/const';

  export default {
    components: {
      ContentDetail,
      RaceBody,
      SectionHeader
    },
    beforeRouteLeave(to, from) {
      if (to.name !== 'races') {
        return;
      }

      this.$emit('scroll-to-last-active', from.path);
    },
    async beforeRouteUpdate(to, from, next) {
      await this.raceInfoQuery(to.path);

      next();
    },

    setup() {
      const queryBooks = computedInject(DEFAULT_QUERY_BOOKS_INJECT_KEY, source => toValue(source), []);

      return { queryBooks };
    },

    data: () => ({
      race: undefined,
      loading: false,
      error: false,
      abortController: null
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile'])
    },
    async mounted() {
      await this.raceInfoQuery(this.$route.path);

      this.$emit('scroll-to-active');
    },
    methods: {
      async raceInfoQuery(url) {
        if (this.abortController) {
          this.abortController.abort();
        }

        try {
          this.error = false;
          this.loading = true;
          this.abortController = new AbortController();

          const resp = await this.$http.post({
            url,
            payload: {
              filter: {
                book: this.queryBooks
              }
            },
            signal: this.abortController.signal
          });

          this.race = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'races' });
      }
    }
  };
</script>

<style lang="scss" scoped>

</style>
