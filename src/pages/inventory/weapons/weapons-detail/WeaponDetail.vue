<script>
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import WeaponBody from '@/pages/inventory/weapons/weapons-detail/WeaponBody.vue';

  export default {
    components: {
      ContentDetail,
      WeaponBody,
      SectionHeader,
    },
    async beforeRouteUpdate(to, from, next) {
      await this.weaponInfoQuery(to.path);

      next();
    },
    data: () => ({
      weapon: undefined,
      loading: false,
      error: false,
      abortController: null,
    }),
    computed: {
      ...mapState(useUIStore, ['fullscreen', 'isMobile']),
    },
    async mounted() {
      await this.weaponInfoQuery(this.$route.path);
    },
    methods: {
      async weaponInfoQuery(url) {
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

          this.weapon = resp.data;
        } catch (err) {
          errorHandler(err);

          this.error = true;
        } finally {
          this.loading = false;
          this.abortController = null;
        }
      },

      close() {
        this.$router.push({ name: 'weapons' });
      },
    },
  };
</script>

<template>
  <content-detail :entity="weapon?.name.rus">
    <template #fixed>
      <section-header
        :fullscreen="!isMobile"
        :subtitle="weapon?.name?.eng"
        :title="weapon?.name?.rus"
        bookmark
        copy
        print
        @close="close"
      />
    </template>

    <template #default>
      <weapon-body
        v-if="weapon"
        :weapon="weapon"
      />
    </template>
  </content-detail>
</template>
