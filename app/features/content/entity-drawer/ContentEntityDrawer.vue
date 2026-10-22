<script setup lang="ts">
  import type { DetailType } from '../model';

  import { CreatureBody } from '~bestiary/creatures';
  import { creatureDetailSchema } from '~bestiary/model';
  import { FeatBody } from '~character/feats';
  import {
    featDetailSchema,
    optionDetailSchema,
    spellDetailSchema,
  } from '~character/model';
  import { OptionBody } from '~character/options';
  import { SpellBody } from '~character/spells';
  import { ArmorBody } from '~inventory/armors';
  import { ItemBody } from '~inventory/items';
  import { MagicItemBody } from '~inventory/magic-items';
  import {
    armorDetailSchema,
    itemDetailSchema,
    magicItemDetailSchema,
    weaponDetailSchema,
  } from '~inventory/model';
  import { WeaponBody } from '~inventory/weapons';
  import { SectionEntryDrawer } from '~section/entry-drawer';
  import { GodBody } from '~wiki/gods';
  import { godDetailSchema, screenDetailSchema } from '~wiki/model';
  import { ScreenBody } from '~wiki/screens';

  import { isFeatDetailType } from '../model';

  /**
   * Карточка сущности из ссылки в тексте: открывается дровером, как на
   * new.ttg.club. Тип ссылки выбирает проверку ответа и карточку раздела.
   */
  const { type, path, title } = defineProps<{
    type: DetailType;
    path: string;
    title: string;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });
</script>

<template>
  <SectionEntryDrawer
    v-if="type === 'spell'"
    v-model:open="isOpen"
    :schema="spellDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <SpellBody :spell="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="isFeatDetailType(type)"
    v-model:open="isOpen"
    :schema="featDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <FeatBody :feat="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'option'"
    v-model:open="isOpen"
    :schema="optionDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <OptionBody :option="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'armor'"
    v-model:open="isOpen"
    :schema="armorDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <ArmorBody :armor="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'weapon'"
    v-model:open="isOpen"
    :schema="weaponDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <WeaponBody :weapon="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'item'"
    v-model:open="isOpen"
    :schema="itemDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <ItemBody :item="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'magic-item'"
    v-model:open="isOpen"
    :schema="magicItemDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <MagicItemBody :item="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'creature'"
    v-model:open="isOpen"
    :schema="creatureDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <CreatureBody :creature="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'god'"
    v-model:open="isOpen"
    :schema="godDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <GodBody :god="entry" />
    </template>
  </SectionEntryDrawer>

  <SectionEntryDrawer
    v-else-if="type === 'screen'"
    v-model:open="isOpen"
    :schema="screenDetailSchema"
    :path="path"
    :title="title"
  >
    <template #default="{ entry }">
      <ScreenBody :screen="entry" />
    </template>
  </SectionEntryDrawer>
</template>
