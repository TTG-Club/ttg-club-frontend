<script setup lang="ts">
  import { WORKSHOP_FIELD_TEXT } from '../model';

  /**
   * Названия записи: русское, английское и альтернативное. Альтернативное
   * показывается, только если его передали: карточки оружия и доспехов
   * его не отдают.
   */
  const name = defineModel<string>('name', { required: true });
  const englishName = defineModel<string>('englishName', { required: true });
  const altName = defineModel<string>('altName');
</script>

<template>
  <UFormField
    :label="WORKSHOP_FIELD_TEXT.name"
    name="name"
    required
  >
    <UInput
      v-model="name"
      class="w-full"
    />
  </UFormField>

  <UFormField
    :label="WORKSHOP_FIELD_TEXT.englishName"
    name="englishName"
    required
  >
    <UInput
      v-model="englishName"
      class="w-full"
    />
  </UFormField>

  <UFormField
    v-if="altName !== undefined"
    :label="WORKSHOP_FIELD_TEXT.altName"
    name="altName"
  >
    <UInput
      v-model="altName"
      class="w-full"
    />
  </UFormField>
</template>
