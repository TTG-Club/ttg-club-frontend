<template>
  <div
    v-if="god"
    class="god_wrapper god-body gods"
  >
    <detail-top-bar
      :left="topBarLeftString"
      :source="god.source"
    />

    <div class="content-padding">
      <ui-easy-lightbox
        :images="god.images"
        :use-bg-hide="false"
      />

      <ul class="stat-list">
        <li>
          <b>Мировоззрение: </b>

          <span>{{ god.alignment }}</span>
        </li>

        <li>
          <b>Символ: </b>

          <span>{{ god.symbol }}</span>
        </li>

        <li v-if="god.domains?.length">
          <b>Домены: </b>

          <span>{{ god.domains.join(', ') }}</span>
        </li>

        <li v-if="god.panteons?.length">
          <b>Пантеон: </b>

          <span>{{ god.panteons.join(', ') }}</span>
        </li>
      </ul>

      <details>
        <summary class="h4">
          <span>Информация из других источников</span>
        </summary>

        <div class="content">
          <ul class="stat-list">
            <li>
              <b>Ранг: </b>

              <span>{{ god.rank }}</span>
            </li>

            <li v-if="god.titles?.length">
              <b>Титулы: </b>

              <span>{{ god.titles.join(', ') }}</span>
            </li>
          </ul>

          <raw-content
            v-if="god.description"
            :template="god.description"
          />
        </div>
      </details>
    </div>
  </div>
</template>

<script>
  import RawContent from '@/components/content/RawContent.vue';
  import DetailTopBar from '@/components/UI/DetailTopBar.vue';
  import UiEasyLightbox from '@/components/UI/kit/UiEasyLightbox.vue';

  export default {
    name: 'GodBody',
    components: {
      UiEasyLightbox,
      DetailTopBar,
      RawContent
    },
    props: {
      god: {
        type: Object,
        default: undefined,
        required: true
      }
    },
    computed: {
      topBarLeftString() {
        return ` `;
      }
    }
  };
</script>
