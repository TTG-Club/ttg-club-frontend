<script setup lang="ts">
  import { WORKSHOP_FIELD_TEXT } from '../model';

  /**
   * Названия записи: русское, английское и альтернативное в одну строку на
   * всю ширину формы. Альтернативное показывается, только если его передали:
   * карточки оружия и доспехов его не отдают.
   */
  const name = defineModel<string>('name', { required: true });
  const englishName = defineModel<string>('englishName', { required: true });
  const altName = defineModel<string>('altName');

  const gridClass = computed(() =>
    altName.value === undefined ? 'md:grid-cols-2' : 'md:grid-cols-3',
  );
</script>

<template>
  <div
    class="col-span-full grid grid-cols-1 gap-x-4 gap-y-3"
    :class="gridClass"
  >
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
  </div>
</template>
