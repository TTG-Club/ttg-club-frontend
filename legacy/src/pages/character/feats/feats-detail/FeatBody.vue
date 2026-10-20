<script setup lang="ts">
  import type { FeatsItem } from '@/shared/types/character/Feats';
  import RawContent from '@/shared/ui/RawContent.vue';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  defineProps<{
    feat: FeatsItem;
  }>();
</script>

<template>
  <div class="feat-body">
    <detail-top-bar
      :left="`Требования: ${feat.requirements || 'Нет'}`"
      :source="feat.source"
    />

    <div class="feat-body__desc content-padding">
      <raw-content :template="feat.description" />
    </div>
  </div>
</template>
