<script setup lang="ts">
  import type { MagicItemDetail } from '../model';

  import { ContentLink, ContentRender } from '~content/render';
  import { DiceRoller } from '~dice-roller/roller';
  import { SectionImagePreview } from '~section/image-preview';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    ARTIFACT_RARITY,
    getMagicItemTypeParts,
    INVENTORY_LIST_SEPARATOR,
    MAGIC_ITEM_TEXT,
  } from '../model';

  /**
   * Карточка магического предмета: тип с уточнениями и редкость в плашке,
   * картинка, настройка, цена по DMG и XGE и описание.
   */
  const { item } = defineProps<{
    item: MagicItemDetail;
  }>();

  const attunement = computed(() =>
    item.customization
      ? MAGIC_ITEM_TEXT.attunementRequired
      : MAGIC_ITEM_TEXT.attunementNone,
  );

  const attunementDetails = computed(() =>
    item.detailCustamization
      ?.join(INVENTORY_LIST_SEPARATOR)
      .toLocaleLowerCase(),
  );

  // Цену артефакта не бросают: она задана текстом
  /**
   * Подпись типа в плашке: «Оружие (длинный меч, любой меч), редкий».
   * Собрана частями, чтобы пробелы не зависели от разметки шаблона.
   */
  const typeParts = computed(() => getMagicItemTypeParts(item));

  const isXgeRollable = computed(() => item.rarity.type !== ARTIFACT_RARITY);
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :source="item.source">
      <template #left>
        <template
          v-for="part in typeParts"
          :key="part.key"
        >
          <ContentLink
            v-if="part.url"
            :href="part.url"
            :attributes="{}"
            >{{ part.text }}</ContentLink
          >

          <template v-else>{{ part.text }}</template>
        </template>
      </template>
    </SectionSourceBar>

    <div class="flow-root">
      <SectionImagePreview
        v-if="item.images?.length"
        :images="item.images"
        :alt="item.name.rus"
      />

      <ul class="flex flex-col gap-1.5">
        <li>
          <b>{{ MAGIC_ITEM_TEXT.attunement }}</b> {{ attunement }}

          <span v-if="attunementDetails">({{ attunementDetails }})</span>
        </li>

        <li v-if="item.cost">
          <b>
            {{ MAGIC_ITEM_TEXT.costBy }}

            <UTooltip :text="MAGIC_ITEM_TEXT.dmgHint">
              <span>{{ MAGIC_ITEM_TEXT.dmg }}</span> </UTooltip
            >:
          </b>

          {{ item.cost.dmg }}
        </li>

        <li v-if="item.cost">
          <b>
            {{ MAGIC_ITEM_TEXT.costBy }}

            <UTooltip :text="MAGIC_ITEM_TEXT.xgeHint">
              <span>{{ MAGIC_ITEM_TEXT.xge }}</span> </UTooltip
            >:
          </b>

          <DiceRoller
            v-if="isXgeRollable"
            :formula="item.cost.xge"
            :label="MAGIC_ITEM_TEXT.xgeRollLabel"
          />

          <span v-else>{{ item.cost.xge }}</span>
        </li>
      </ul>
    </div>

    <ContentRender
      v-if="item.description"
      :html="item.description"
    />
  </div>
</template>
