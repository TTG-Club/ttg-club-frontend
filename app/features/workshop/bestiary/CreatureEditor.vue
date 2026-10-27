<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { CreatureForm, WorkshopCreature } from '../model';

  import { CreatureBody } from '~bestiary/creatures';
  import { creatureDetailSchema } from '~bestiary/model';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    BESTIARY_WORKSHOP_KEY,
    createCreatureForm,
    CREATURE_ABILITIES,
    CREATURE_ABILITY_LIMIT,
    CREATURE_ALIGNMENT_OPTIONS,
    CREATURE_ARMOR_OPTIONS,
    CREATURE_BLOCK_SECTIONS,
    CREATURE_BLOCK_TEXT,
    CREATURE_BONUS_TEXT,
    CREATURE_CONDITION_OPTIONS,
    CREATURE_DAMAGE_OPTIONS,
    CREATURE_EDITOR_TEXT,
    CREATURE_ENVIRONMENT_OPTIONS,
    CREATURE_ROWS,
    CREATURE_TYPE_OPTIONS,
    creatureFormSchema,
    getCreatureHits,
    getCreatureHtmlFields,
    getCreaturePayload,
    getHtmlFieldErrors,
    getWorkshopSectionRoute,
    RACE_SIZE_OPTIONS,
    saveWorkshopCreature,
    WORKSHOP_ABILITY_OPTIONS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_SKILL_OPTIONS,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';
  import CreatureBlocksEditor from './CreatureBlocksEditor.vue';
  import CreatureBonusesEditor from './CreatureBonusesEditor.vue';
  import CreatureLegendaryEditor from './CreatureLegendaryEditor.vue';

  /** Форма существа: без записи — создание нового. */
  const { creature = undefined } = defineProps<{
    creature?: WorkshopCreature;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<CreatureForm>(createCreatureForm(creature));
  const source = ref(creature?.source);

  const sizeItems = [...RACE_SIZE_OPTIONS];
  const typeItems = [...CREATURE_TYPE_OPTIONS];
  const alignmentItems = [...CREATURE_ALIGNMENT_OPTIONS];
  const armorItems = [...CREATURE_ARMOR_OPTIONS];
  const damageItems = [...CREATURE_DAMAGE_OPTIONS];
  const conditionItems = [...CREATURE_CONDITION_OPTIONS];
  const environmentItems = [...CREATURE_ENVIRONMENT_OPTIONS];

  const cancelTo = getWorkshopSectionRoute(BESTIARY_WORKSHOP_KEY);

  const hits = computed(() =>
    getCreatureHits(state.size, state.ability.con, state.diceCount),
  );

  const averageText = computed(() =>
    hits.value.average
      ? String(hits.value.average)
      : CREATURE_EDITOR_TEXT.empty,
  );

  const formulaText = computed(
    () => hits.value.formula || CREATURE_EDITOR_TEXT.empty,
  );

  const { isSaving, save } = useWorkshopSave(
    BESTIARY_WORKSHOP_KEY,
    () => creature?.id,
    {
      created: CREATURE_EDITOR_TEXT.created,
      saved: CREATURE_EDITOR_TEXT.saved,
      error: CREATURE_EDITOR_TEXT.saveError,
    },
    saveWorkshopCreature,
  );

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(
    BESTIARY_WORKSHOP_KEY,
    () => creature?.id,
    creatureDetailSchema,
  );

  /**
   * Предпросмотр по текущим данным формы. С ошибками в форме он не
   * открывается: ошибки подсвечиваются у полей, как при сохранении.
   */
  async function openPreview(): Promise<void> {
    const data = await editorForm.value?.validate({
      transform: true,
      silent: true,
    });

    if (data) {
      await showPreview(getCreaturePayload(data, creature?.id, source.value));
    }
  }

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<CreatureForm>): Array<FormError> {
    return getHtmlFieldErrors(getCreatureHtmlFields(form));
  }

  async function submit(event: FormSubmitEvent<CreatureForm>): Promise<void> {
    const saved = await save(
      getCreaturePayload(event.data, creature?.id, source.value),
    );

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="creatureFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4 lg:grid-cols-6"
    @submit="submit"
  >
    <WorkshopNameFields
      v-model:name="state.name"
      v-model:english-name="state.englishName"
      v-model:alt-name="state.altName"
    />

    <UFormField
      :label="CREATURE_EDITOR_TEXT.size"
      name="size"
      class="col-span-2"
      required
    >
      <USelect
        v-model="state.size"
        :items="sizeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.type"
      name="type"
      class="col-span-2"
      required
    >
      <USelect
        v-model="state.type"
        :items="typeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.alignment"
      name="alignment"
      class="col-span-2"
      required
    >
      <USelect
        v-model="state.alignment"
        :items="alignmentItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.challengeRating"
      name="challengeRating"
      required
    >
      <UInput
        v-model="state.challengeRating"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.armorClass"
      name="armorClass"
      required
    >
      <UInputNumber
        v-model="state.armorClass"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.armorText"
      name="armorText"
      class="col-span-2"
    >
      <UInput
        v-model="state.armorText"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.armors"
      name="armors"
      class="col-span-2 md:col-span-4 lg:col-span-2"
    >
      <USelectMenu
        v-model="state.armors"
        :items="armorItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <h3 class="col-span-full pt-2 text-base font-semibold text-highlighted">
      {{ CREATURE_EDITOR_TEXT.hitsTitle }}
    </h3>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.diceCount"
      name="diceCount"
      required
    >
      <UInputNumber
        v-model="state.diceCount"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="CREATURE_EDITOR_TEXT.average">
      <UInput
        :model-value="averageText"
        class="w-full"
        readonly
      />
    </UFormField>

    <UFormField :label="CREATURE_EDITOR_TEXT.formula">
      <UInput
        :model-value="formulaText"
        class="w-full"
        readonly
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.hitText"
      name="hitText"
      class="col-span-2 md:col-span-1 lg:col-span-3"
    >
      <UInput
        v-model="state.hitText"
        class="w-full"
      />
    </UFormField>

    <h3 class="col-span-full pt-2 text-base font-semibold text-highlighted">
      {{ CREATURE_EDITOR_TEXT.speedTitle }}
    </h3>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.speed"
      name="speed"
      required
    >
      <UInputNumber
        v-model="state.speed"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.fly"
      name="fly"
    >
      <UInputNumber
        v-model="state.fly"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.swim"
      name="swim"
    >
      <UInputNumber
        v-model="state.swim"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.climb"
      name="climb"
    >
      <UInputNumber
        v-model="state.climb"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.dig"
      name="dig"
    >
      <UInputNumber
        v-model="state.dig"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <div class="flex items-center pt-6">
      <UCheckbox
        v-model="state.hover"
        :label="CREATURE_EDITOR_TEXT.hover"
        name="hover"
      />
    </div>

    <h3 class="col-span-full pt-2 text-base font-semibold text-highlighted">
      {{ CREATURE_EDITOR_TEXT.abilitiesTitle }}
    </h3>

    <div class="col-span-full grid grid-cols-3 gap-x-4 gap-y-3 lg:grid-cols-6">
      <UFormField
        v-for="ability in CREATURE_ABILITIES"
        :key="ability.key"
        :label="ability.label"
        :name="`ability.${ability.key}`"
        required
      >
        <UInputNumber
          v-model="state.ability[ability.key]"
          :min="CREATURE_ABILITY_LIMIT.min"
          :max="CREATURE_ABILITY_LIMIT.max"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="col-span-full lg:col-span-3">
      <CreatureBonusesEditor
        v-model="state.savingThrows"
        :title="CREATURE_BONUS_TEXT.savingThrows"
        :key-label="CREATURE_BONUS_TEXT.ability"
        :options="WORKSHOP_ABILITY_OPTIONS"
        :empty-text="CREATURE_BONUS_TEXT.emptySavingThrows"
        field="savingThrows"
      />
    </div>

    <div class="col-span-full lg:col-span-3">
      <CreatureBonusesEditor
        v-model="state.skills"
        :title="CREATURE_BONUS_TEXT.skills"
        :key-label="CREATURE_BONUS_TEXT.skill"
        :options="WORKSHOP_SKILL_OPTIONS"
        :empty-text="CREATURE_BONUS_TEXT.emptySkills"
        field="skills"
      />
    </div>

    <h3 class="col-span-full pt-2 text-base font-semibold text-highlighted">
      {{ CREATURE_EDITOR_TEXT.sensesTitle }}
    </h3>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.passivePerception"
      name="passivePerception"
      class="col-span-2"
    >
      <UInput
        v-model="state.passivePerception"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.darkvision"
      name="darkvision"
    >
      <UInputNumber
        v-model="state.darkvision"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.truesight"
      name="truesight"
    >
      <UInputNumber
        v-model="state.truesight"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.tremorsense"
      name="tremorsense"
    >
      <UInputNumber
        v-model="state.tremorsense"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.blindsight"
      name="blindsight"
      class="col-span-2 md:col-span-1"
    >
      <UInputNumber
        v-model="state.blindsight"
        :min="0"
        class="w-full"
      />

      <UCheckbox
        v-model="state.blindBeyond"
        :label="CREATURE_EDITOR_TEXT.blindBeyond"
        name="blindBeyond"
        size="sm"
        class="mt-2"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.languages"
      name="languages"
      class="col-span-2 lg:col-span-3"
    >
      <UInput
        v-model="state.languages"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.language"
      name="language"
      class="col-span-2 lg:col-span-3"
    >
      <UInput
        v-model="state.language"
        :placeholder="CREATURE_EDITOR_TEXT.languagePlaceholder"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.tags"
      name="tags"
      class="col-span-2 lg:col-span-3"
    >
      <UInput
        v-model="state.tags"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.damageResistances"
      name="damageResistances"
      class="col-span-2 lg:col-span-3"
    >
      <USelectMenu
        v-model="state.damageResistances"
        :items="damageItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.damageImmunities"
      name="damageImmunities"
      class="col-span-2 lg:col-span-3"
    >
      <USelectMenu
        v-model="state.damageImmunities"
        :items="damageItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.damageVulnerabilities"
      name="damageVulnerabilities"
      class="col-span-2 lg:col-span-3"
    >
      <USelectMenu
        v-model="state.damageVulnerabilities"
        :items="damageItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.conditionImmunities"
      name="conditionImmunities"
      class="col-span-2 lg:col-span-3"
    >
      <USelectMenu
        v-model="state.conditionImmunities"
        :items="conditionItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.environment"
      name="environment"
      class="col-span-2 lg:col-span-3"
    >
      <USelectMenu
        v-model="state.environment"
        :items="environmentItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="CREATURE_ROWS.description"
      />
    </UFormField>

    <div
      v-for="section in CREATURE_BLOCK_SECTIONS"
      :key="section.field"
      class="col-span-full"
    >
      <CreatureBlocksEditor
        v-model="state[section.field]"
        :title="section.title"
        :field="section.field"
      />
    </div>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.reaction"
      name="reaction"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.reaction"
        :rows="CREATURE_ROWS.short"
      />
    </UFormField>

    <div class="col-span-full">
      <CreatureLegendaryEditor v-model="state.legendary" />
    </div>

    <UFormField
      :label="CREATURE_EDITOR_TEXT.legendaryDescription"
      name="legendaryDescription"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.legendaryDescription"
        :rows="CREATURE_ROWS.short"
      />
    </UFormField>

    <div class="col-span-full">
      <CreatureBlocksEditor
        v-model="state.mysticalActions"
        :title="CREATURE_BLOCK_TEXT.mystical"
        field="mysticalActions"
      />
    </div>

    <div class="col-span-full lg:col-span-4">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <UFormField
      :help="CREATURE_EDITOR_TEXT.npcHelp"
      name="npc"
      class="col-span-full lg:col-span-2 lg:pt-6"
    >
      <UCheckbox
        v-model="state.npc"
        :label="CREATURE_EDITOR_TEXT.npc"
      />
    </UFormField>

    <WorkshopFormActions
      :is-editing="!!creature"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
    >
      <UButton
        :label="WORKSHOP_TEXT.preview"
        :icon="WORKSHOP_ICON.preview"
        :loading="isPreviewLoading"
        color="neutral"
        variant="soft"
        @click.left.exact.prevent="openPreview"
      />
    </WorkshopFormActions>

    <WorkshopPreviewDrawer
      v-model:open="isPreviewOpen"
      :entry="previewEntry"
      :is-loading="isPreviewLoading"
      :is-error="isPreviewError"
    >
      <template #default="{ entry }">
        <CreatureBody :creature="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
