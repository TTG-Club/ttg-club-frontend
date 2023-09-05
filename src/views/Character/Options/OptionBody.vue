<template>
  <div class="option-body">
    <detail-top-bar
      :left="`Требования: ${option?.requirements || 'Нет'}`"
      :source="option?.source"
    />

    <div class="option-body__desc content-padding">
      <raw-content :template="option?.description" />

      <div
        v-if="option?.classes?.length"
        class="spell_stat_block_bottom"
      >
        <p>Классы:</p>

        <div class="classes_icon">
          <span
            v-for="(el, key) in option.classes"
            :key="key"
          >
            <router-link :to="{ path: el.url }">{{ el.name }}</router-link>

            <span v-if="key !== option.classes.length - 1">,&nbsp;</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import RawContent from '@/components/content/RawContent.vue';
  import DetailTopBar from '@/components/UI/DetailTopBar.vue';

  export default {
    name: 'OptionBody',
    components: {
      DetailTopBar,
      RawContent
    },
    props: {
      option: {
        type: Object,
        default: undefined,
        required: true
      }
    }
  };
</script>
