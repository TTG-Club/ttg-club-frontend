<script>
  import DiceRoller from '@/shared/ui/DiceRoller.vue';
  import UiEasyLightbox from '@/shared/ui/kit/UiEasyLightbox.vue';
  import RawContent from '@/shared/ui/RawContent.vue';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  export default {
    name: 'MagicItemBody',
    components: {
      UiEasyLightbox,
      DetailTopBar,
      RawContent,
      DiceRoller,
    },
    props: {
      magicItem: {
        type: Object,
        default: undefined,
        required: true,
      },
      inTooltip: {
        type: Boolean,
        default: false,
      },
    },
  };
</script>

<template>
  <div
    v-if="magicItem"
    :class="{ 'in-tooltip': inTooltip }"
    class="magic-item_wrapper magic-item-body bestiary"
  >
    <detail-top-bar :source="magicItem.source">
      <template #left>
        <span>{{ magicItem.type.name }}</span>

        <span v-if="magicItem.detailType?.length">
          (<span
            v-for="(magicUrl, key) in magicItem.detailType"
            :key="key + magicUrl.url"
          >
            <span v-if="magicUrl.url?.length">
              <router-link :to="magicUrl.url">{{ magicUrl.name }}</router-link>
            </span>

            <span v-else>{{ magicUrl.name }}</span>

            <span v-if="key < magicItem.detailType?.length - 1">, </span> </span
          >)
        </span>

        <span>, {{ magicItem.rarity.name }}</span>
      </template>
    </detail-top-bar>

    <div class="content-padding">
      <ui-easy-lightbox
        :images="magicItem.images"
        :use-bg-hide="false"
      />

      <ul class="stat-list">
        <li>
          <b>Настройка: </b>

          <span>{{
            magicItem.customization ? 'требуется настройка' : 'нет'
          }}</span>

          <span v-if="magicItem.detailCustamization?.length">
            ({{ magicItem.detailCustamization.join(', ').toLowerCase() }})
          </span>
        </li>

        <li v-if="magicItem.cost">
          <b>Стоимость по <span v-tippy="'Руководство Мастера'">DMG</span>: </b>

          <span>{{ magicItem.cost.dmg }}</span>
        </li>

        <li v-if="magicItem.cost">
          <b
            >Стоимость по
            <span v-tippy="'Руководство Зантара обо всем'">XGE</span>:
          </b>

          <span v-if="magicItem.rarity?.type === 'artifact'"
            >{{ magicItem.cost.xge }}
          </span>

          <span v-else>
            <dice-roller
              :formula="magicItem.cost.xge"
              label="Стоимсть предмета по XGE"
            />
          </span>
        </li>
      </ul>

      <raw-content
        v-if="magicItem.description"
        :template="magicItem.description"
      />
    </div>
  </div>
</template>
