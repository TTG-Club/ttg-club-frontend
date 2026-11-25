<script setup lang="ts">
  import { WorkshopCatalogPicker } from '../catalog-picker';
  import { MAGIC_ITEM_BASE_SECTIONS, MAGIC_ITEM_EDITOR_TEXT } from '../model';

  /**
   * Немагическая основа магического предмета: оружие и доспехи, на которых
   * он построен, выбором из разделов с их фильтрами, как на new.ttg.club.
   * Значения — адреса страниц без раздела.
   */
  const weapons = defineModel<Array<string>>('weapons', { required: true });
  const armors = defineModel<Array<string>>('armors', { required: true });
</script>

<template>
  <UFormField
    :label="MAGIC_ITEM_EDITOR_TEXT.baseWeapons"
    :help="MAGIC_ITEM_EDITOR_TEXT.baseHelp"
    name="weapons"
    class="col-span-2"
  >
    <WorkshopCatalogPicker
      v-model="weapons"
      :section="MAGIC_ITEM_BASE_SECTIONS.weapons"
      :title="MAGIC_ITEM_BASE_SECTIONS.weapons.title"
      :placeholder="MAGIC_ITEM_EDITOR_TEXT.baseWeaponsPlaceholder"
      preview-type="weapon"
    />
  </UFormField>

  <UFormField
    :label="MAGIC_ITEM_EDITOR_TEXT.baseArmors"
    name="armors"
    class="col-span-2"
  >
    <WorkshopCatalogPicker
      v-model="armors"
      :section="MAGIC_ITEM_BASE_SECTIONS.armors"
      :title="MAGIC_ITEM_BASE_SECTIONS.armors.title"
      :placeholder="MAGIC_ITEM_EDITOR_TEXT.baseArmorsPlaceholder"
      preview-type="armor"
    />
  </UFormField>
</template>
