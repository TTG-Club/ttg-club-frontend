<script setup lang="ts">
  import { useMagicItemBaseOptions } from '../composables';
  import { MAGIC_ITEM_EDITOR_TEXT } from '../model';

  /**
   * Немагическая основа магического предмета: оружие и доспехи, на которых
   * он построен. Значения — адреса их страниц без раздела.
   */
  const weapons = defineModel<Array<string>>('weapons', { required: true });
  const armors = defineModel<Array<string>>('armors', { required: true });

  const { weaponOptions, armorOptions, isLoading } = useMagicItemBaseOptions();
</script>

<template>
  <UFormField
    :label="MAGIC_ITEM_EDITOR_TEXT.baseWeapons"
    :help="MAGIC_ITEM_EDITOR_TEXT.baseHelp"
    name="weapons"
    class="col-span-2"
  >
    <USelectMenu
      v-model="weapons"
      :items="weaponOptions"
      :loading="isLoading"
      :placeholder="MAGIC_ITEM_EDITOR_TEXT.basePlaceholder"
      value-key="value"
      class="w-full"
      multiple
    />
  </UFormField>

  <UFormField
    :label="MAGIC_ITEM_EDITOR_TEXT.baseArmors"
    name="armors"
    class="col-span-2"
  >
    <USelectMenu
      v-model="armors"
      :items="armorOptions"
      :loading="isLoading"
      :placeholder="MAGIC_ITEM_EDITOR_TEXT.basePlaceholder"
      value-key="value"
      class="w-full"
      multiple
    />
  </UFormField>
</template>
