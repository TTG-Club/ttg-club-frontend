<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getTypeGroup,
    WEAPON_TEXT,
    weaponLinkSchema,
    WEAPONS_SECTION,
  } from '../model';
  import WeaponEntry from './WeaponEntry.vue';
</script>

<template>
  <!-- Оружие сгруппировано по типу; во второй строке урон и цена -->
  <SectionPage
    :section="WEAPONS_SECTION"
    :schema="weaponLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getTypeGroup"
    :get-path="getEntryUrl"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
        :source="item.source"
      >
        <template #details>
          <span
            v-if="item.damage"
            class="flex shrink-0 gap-1"
          >
            <UTooltip
              v-if="item.damage.dice"
              :text="WEAPON_TEXT.damage"
            >
              <span class="text-default">{{ item.damage.dice }}</span>
            </UTooltip>

            <UTooltip
              v-if="item.damage.type"
              :text="WEAPON_TEXT.damageType"
            >
              <span>{{ item.damage.type }}</span>
            </UTooltip>
          </span>

          <UTooltip
            v-if="item.price"
            :text="WEAPON_TEXT.price"
          >
            <span class="shrink-0 text-highlighted">{{ item.price }}</span>
          </UTooltip>
        </template>
      </SectionLink>
    </template>

    <template #entry="{ path }">
      <WeaponEntry :path="path" />
    </template>
  </SectionPage>
</template>
