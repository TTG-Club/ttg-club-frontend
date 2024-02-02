<script>
  import RawContent from '@/shared/ui/RawContent.vue';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  export default {
    name: 'BackgroundBody',
    components: {
      DetailTopBar,
      RawContent,
    },
    props: {
      background: {
        type: Object,
        default: undefined,
        required: true,
      },
    },
    computed: {
      topBarLeftString() {
        return ` `;
      },
    },
  };
</script>

<template>
  <div class="background-body">
    <detail-top-bar
      :left="topBarLeftString"
      :source="background?.source"
    />

    <div class="background-body__desc content-padding">
      <raw-content :url="background?.url" />
    </div>
  </div>
</template>
