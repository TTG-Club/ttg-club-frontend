<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { WeaponForm, WorkshopWeapon } from '../model';

  import { useFilterGroups, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createWeaponForm,
    getHtmlFieldErrors,
    getWeaponPayload,
    getWorkshopSectionRoute,
    WEAPON_DAMAGE_TYPE_OPTIONS,
    WEAPON_DESCRIPTION_ROWS,
    WEAPON_DICE_OPTIONS,
    WEAPON_EDITOR_TEXT,
    WEAPON_PROPERTIES_FILTER_KEY,
    WEAPON_SPECIAL_ROWS,
    WEAPON_TYPE_OPTIONS,
    weaponFormSchema,
    WEAPONS_FILTER_PATH,
    WEAPONS_WORKSHOP_KEY,
    WORKSHOP_CURRENCY_OPTIONS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_WEIGHT_STEP,
  } from '../model';

  /** Форма оружия: без записи — создание нового. */
  const { weapon = undefined } = defineProps<{
    weapon?: WorkshopWeapon;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<WeaponForm>(createWeaponForm(weapon));
  const source = ref(weapon?.source);

  const typeItems = [...WEAPON_TYPE_OPTIONS];
  const damageTypeItems = [...WEAPON_DAMAGE_TYPE_OPTIONS];
  const diceItems = [...WEAPON_DICE_OPTIONS];
  const currencyItems = [...WORKSHOP_CURRENCY_OPTIONS];

  // Свойства берутся из фильтров оружия: у них числовые идентификаторы
  const { isLoading: isPropertiesLoading, getOptions } =
    useFilterGroups(WEAPONS_FILTER_PATH);

  const propertyItems = computed(() =>
    getOptions(WEAPON_PROPERTIES_FILTER_KEY),
  );

  const cancelTo = getWorkshopSectionRoute(WEAPONS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    WEAPONS_WORKSHOP_KEY,
    () => weapon?.id,
    {
      created: WEAPON_EDITOR_TEXT.created,
      saved: WEAPON_EDITOR_TEXT.saved,
      error: WEAPON_EDITOR_TEXT.saveError,
    },
  );

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<WeaponForm>): Array<FormError> {
    return getHtmlFieldErrors({
      description: form.description ?? '',
      special: form.special ?? '',
    });
  }

  async function submit(event: FormSubmitEvent<WeaponForm>): Promise<void> {
    const saved = await save(getWeaponPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="weaponFormSchema"
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
      :label="WEAPON_EDITOR_TEXT.damageType"
      name="damageType"
      required
    >
      <USelect
        v-model="state.damageType"
        :items="damageTypeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.numberDice"
      name="numberDice"
    >
      <UInputNumber
        v-model="state.numberDice"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.damageDice"
      name="damageDice"
    >
      <USelectMenu
        v-model="state.damageDice"
        :items="diceItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.twoHandDamageDice"
      :help="WEAPON_EDITOR_TEXT.twoHandHelp"
      name="twoHandDamageDice"
    >
      <USelectMenu
        v-model="state.twoHandDamageDice"
        :items="diceItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.ammo"
      name="ammo"
    >
      <UInputNumber
        v-model="state.ammo"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.cost"
      name="cost"
    >
      <UInputNumber
        v-model="state.cost"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.currency"
      name="currency"
    >
      <USelectMenu
        v-model="state.currency"
        :items="currencyItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
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
      :label="WEAPON_EDITOR_TEXT.properties"
      name="properties"
    >
      <USelectMenu
        v-model="state.properties"
        :items="propertyItems"
        :loading="isPropertiesLoading"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.minDistance"
      :help="WEAPON_EDITOR_TEXT.distanceHelp"
      name="minDistance"
    >
      <UInputNumber
        v-model="state.minDistance"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.maxDistance"
      :help="WEAPON_EDITOR_TEXT.distanceHelp"
      name="maxDistance"
    >
      <UInputNumber
        v-model="state.maxDistance"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="WEAPON_DESCRIPTION_ROWS"
      />
    </UFormField>

    <UFormField
      :label="WEAPON_EDITOR_TEXT.special"
      name="special"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.special"
        :rows="WEAPON_SPECIAL_ROWS"
      />
    </UFormField>

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!weapon"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
    />
  </UForm>
</template>
