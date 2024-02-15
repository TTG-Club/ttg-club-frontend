<script>
  import RawContent from '@/shared/ui/RawContent.vue';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  export default {
    name: 'TraitBody',
    components: {
      DetailTopBar,
      RawContent,
    },
    props: {
      trait: {
        type: Object,
        default: undefined,
        required: true,
      },
    },
  };
</script>

<template>
  <div class="trait-body">
    <detail-top-bar
      :left="`Требования: ${trait?.requirements || 'Нет'}`"
      :source="trait?.source"
    />

    <div class="trait-body__desc content-padding">
      <raw-content :template="trait?.description" />
    </div>
  </div>
</template>
