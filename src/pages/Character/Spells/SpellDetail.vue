<template>
  <content-detail class="spell-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :fullscreen="!isMobile"
        :subtitle="spell?.name?.eng || ''"
        :title="spell?.name?.rus || ''"
        bookmark
        print
        @close="close"
      />
    </template>

    <template #default>
      <spell-body
        v-if="spell"
        :spell="spell"
      />
    </template>
  </content-detail>
</template>

<script>
  import { mapState } from 'pinia';

  import SpellBody from '@/pages/Character/Spells/SpellBody.vue';

  import SectionHeader from '@/features/SectionHeader.vue';

  import { errorHandler } from '@/shared/helpers/errorHandler';
  import { useUIStore } from '@/shared/stores/UIStore.js';
  import ContentDetail from '@/shared/ui/content/ContentDetail.vue';

  export default {
    components: {
      ContentDetail,
      SpellBody,
      SectionHeader
    },
    async beforeRouteUpdate(to, from, next) {
      await this.spellInfoQuery(to.path);

      next();
    },
    data: () => ({
      spell: undefined,
      loading: false,
      error: false,
      abortController: null
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile'])
    },
    async mounted() {
      await this.spellInfoQuery(this.$route.path);
    },
    methods: {
      async spellInfoQuery(url) {
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

          this.spell = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'spells' });
      }
    }
  };
</script>

<style lang="scss" scoped>
  .spell-detail {
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &__loader {
      width: 100%;
      flex: 1 1 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      &_img {
        width: 70%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        &:before {
          content: '';
          display: block;
          width: 100%;
          padding-bottom: 100%;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: absolute;
          filter: drop-shadow(0 0 12px var(--bg-main));
        }
      }
    }
  }
</style>
