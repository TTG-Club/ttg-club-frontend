<template>
  <div
    :class="{ 'in-tooltip': inTooltip }"
    class="item-body"
  >
    <detail-top-bar
      :left="categoriesString"
      :source="item.source"
    />

    <div class="content-padding">
      <ul class="stat-list">
        <li v-if="item.price">
          <b>Стоимость: </b>

          <span>{{ item.price }}</span>
        </li>

        <li v-if="item.weight">
          <b>Вес (в фунтах): </b>

          <span>{{ item.weight }}</span>
        </li>
      </ul>

      <raw-content
        v-if="item?.description"
        :template="item.description"
      />
    </div>
  </div>
</template>

<script>
  import DetailTopBar from '@/features/DetailTopBar.vue';

  import RawContent from '@/shared/ui/content/RawContent.vue';

  export default {
    name: 'ItemBody',
    components: {
      DetailTopBar,
      RawContent
    },
    props: {
      item: {
        type: Object,
        default: undefined,
        required: true
      },
      inTooltip: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      categoriesString() {
        if (!this.item.categories?.length) {
          return '';
        }

        let str = '';

        if (this.item.categories.length === 1) {
          str += 'Категория: ';
        }

        if (this.item.categories.length > 1) {
          str += 'Категории: ';
        }

        str += this.item.categories.join(', ');

        return str;
      }
    }
  };
</script>
