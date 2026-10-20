<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { useUserStore } from '@/shared/stores/UserStore';
  import type { Maybe } from '@/shared/types/Utility';
  import type { RuleDetail as RuleDetailData } from '@/shared/types/wiki/Rules';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import { CommentsBlock } from '@/features/comments';
  import SectionHeader from '@/features/SectionHeader.vue';

  import RuleBody from '@/pages/wiki/rules/rules-detail/RuleBody.vue';

  const route = useRoute();
  const router = useRouter();
  const { isMobile } = storeToRefs(useUIStore());
  const { isEditor } = storeToRefs(useUserStore());

  const rule = ref<Maybe<RuleDetailData>>(undefined);
  const loading = ref(false);
  const error = ref(false);
  const abortController = ref<AbortController | null>(null);

  const editUrl = computed(() =>
    isEditor.value && rule.value
      ? `/workshop/rules/${route.params.ruleName}/edit`
      : '',
  );

  const ruleInfoQuery = async (url: string) => {
    abortController.value?.abort();

    try {
      error.value = false;
      loading.value = true;
      abortController.value = new AbortController();

      const response = await httpClient.post<RuleDetailData>({
        url,
        signal: abortController.value.signal,
      });

      rule.value = response.data;
    } catch (err) {
      errorHandler(err);
      error.value = true;
    } finally {
      loading.value = false;
      abortController.value = null;
    }
  };

  const close = () => {
    router.push({ name: 'rules' });
  };

  onBeforeRouteUpdate(async (to) => {
    await ruleInfoQuery(to.path);
  });

  onMounted(async () => {
    await ruleInfoQuery(route.path);
  });
</script>

<template>
  <content-detail class="rule-detail">
    <template #fixed>
      <section-header
        :copy="!error && !loading"
        :edit-url="editUrl"
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

      <comments-block />
    </template>
  </content-detail>
</template>
