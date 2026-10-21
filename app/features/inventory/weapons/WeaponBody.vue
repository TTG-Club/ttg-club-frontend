<script setup lang="ts">
  import type { WeaponDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { DiceRoller } from '~dice-roller/roller';
  import { SectionSourceBar } from '~section/source-bar';
  import { SectionStat, SectionStatGrid } from '~section/stat-grid';

  import { INVENTORY_EMPTY_VALUE, WEAPON_TEXT } from '../model';
  import WeaponProperties from './WeaponProperties.vue';

  /** Карточка оружия: тип, цена, урон, вес, свойства и описание. */
  const { weapon } = defineProps<{
    weapon: WeaponDetail;
  }>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar
      :left="weapon.type.name"
      :source="weapon.source"
    />

    <SectionStatGrid>
      <SectionStat :label="WEAPON_TEXT.price">
        {{ weapon.price || INVENTORY_EMPTY_VALUE }}
      </SectionStat>

      <SectionStat :label="WEAPON_TEXT.damage">
        <span class="inline-flex flex-wrap gap-x-1">
          <DiceRoller
            v-if="weapon.damage?.dice"
            :formula="weapon.damage.dice"
            :label="WEAPON_TEXT.damage"
          >
            {{ weapon.damage.dice }}
          </DiceRoller>

          <span v-if="weapon.damage?.type">{{ weapon.damage.type }}</span>
        </span>
      </SectionStat>

      <SectionStat :label="WEAPON_TEXT.weight">
        {{ weapon.weight ?? INVENTORY_EMPTY_VALUE }}
      </SectionStat>

      <SectionStat
        v-if="weapon.properties?.length"
        :label="WEAPON_TEXT.properties"
      >
        <WeaponProperties :properties="weapon.properties" />
      </SectionStat>
    </SectionStatGrid>

    <ContentRender
      v-if="weapon.description"
      :html="weapon.description"
    />

    <div v-if="weapon.special">
      <strong>{{ WEAPON_TEXT.special }}</strong>

      <ContentRender :html="weapon.special" />
    </div>
  </div>
</template>
