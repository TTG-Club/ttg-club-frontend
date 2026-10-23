<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { ArmorForm, WorkshopArmor } from '../model';

  import { useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    ARMOR_DESCRIPTION_ROWS,
    ARMOR_EDITOR_TEXT,
    ARMOR_TYPE_OPTIONS,
    armorFormSchema,
    ARMORS_WORKSHOP_KEY,
    createArmorForm,
    getArmorPayload,
    getHtmlFieldErrors,
    getWorkshopSectionRoute,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_WEIGHT_STEP,
  } from '../model';

  /** Форма доспеха: без записи — создание нового. */
  const { armor = undefined } = defineProps<{
    armor?: WorkshopArmor;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<ArmorForm>(createArmorForm(armor));
  const source = ref(armor?.source);

  const typeItems = [...ARMOR_TYPE_OPTIONS];

  const cancelTo = getWorkshopSectionRoute(ARMORS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    ARMORS_WORKSHOP_KEY,
    () => armor?.id,
    {
      created: ARMOR_EDITOR_TEXT.created,
      saved: ARMOR_EDITOR_TEXT.saved,
      error: ARMOR_EDITOR_TEXT.saveError,
    },
  );

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<ArmorForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<ArmorForm>): Promise<void> {
    const saved = await save(getArmorPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="armorFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-1 gap-4 md:grid-cols-2"
    @submit="submit"
  >
    <WorkshopNameFields
      v-model:name="state.name"
      v-model:english-name="state.englishName"
    />

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.type"
      name="type"
      required
    >
      <USelect
        v-model="state.type"
        :items="typeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ARMOR_EDITOR_TEXT.armorClass"
      name="armorClass"
    >
      <UInputNumber
        v-model="state.armorClass"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ARMOR_EDITOR_TEXT.cost"
      name="cost"
    >
      <UInputNumber
        v-model="state.cost"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.weight"
      :help="WORKSHOP_FIELD_TEXT.weightHelp"
      name="weight"
    >
      <UInputNumber
        v-model="state.weight"
        :min="0"
        :step="WORKSHOP_WEIGHT_STEP"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ARMOR_EDITOR_TEXT.forceRequirements"
      name="forceRequirements"
    >
      <UInputNumber
        v-model="state.forceRequirements"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <div class="flex items-center md:pt-6">
      <UCheckbox
        v-model="state.stealthHindrance"
        :label="ARMOR_EDITOR_TEXT.stealthHindrance"
      />
    </div>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="ARMOR_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!armor"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
    />
  </UForm>
</template>
