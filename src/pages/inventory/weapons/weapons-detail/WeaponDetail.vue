<script>
  import { useUIStore } from '@/shared/stores/UIStore';
  import { useUserStore } from '@/shared/stores/UserStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import { CommentsBlock } from '@/features/comments';
  import SectionHeader from '@/features/SectionHeader.vue';

  import WeaponBody from '@/pages/inventory/weapons/weapons-detail/WeaponBody.vue';

  export default {
    components: {
      CommentsBlock,
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
      ...mapState(useUserStore, ['isEditor']),
      editUrl() {
        return this.isEditor && this.weapon
          ? `/workshop/weapons/${this.$route.params.weaponName}/edit`
          : '';
      },
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
        :edit-url="editUrl"
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

      <comments-block />
    </template>
  </content-detail>
</template>
