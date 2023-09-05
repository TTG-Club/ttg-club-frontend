<template>
  <div class="rule-body">
    <detail-top-bar
      :left="`Категория: ${rule.type}`"
      :source="rule.source"
    />

    <div class="content-padding">
      <raw-content
        v-if="rule?.description"
        :template="rule.description"
      />
    </div>
  </div>
</template>

<script>
  import RawContent from '@/components/content/RawContent.vue';
  import DetailTopBar from '@/components/UI/DetailTopBar.vue';

  export default {
    name: 'RuleBody',
    components: {
      DetailTopBar,
      RawContent
    },
    props: {
      rule: {
        type: Object,
        default: undefined,
        required: true
      }
    }
  };
</script>
