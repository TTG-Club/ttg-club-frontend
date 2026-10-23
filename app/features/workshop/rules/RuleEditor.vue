<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { RuleForm, WorkshopRule } from '../model';

  import { useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createRuleForm,
    getHtmlFieldErrors,
    getRulePayload,
    RULE_DESCRIPTION_ROWS,
    RULE_EDITOR_TEXT,
    ruleFormSchema,
    RULES_WORKSHOP_KEY,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ROUTE,
  } from '../model';

  /** Форма правила или термина: их можно только править. */
  const { rule } = defineProps<{
    rule: WorkshopRule;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<RuleForm>(createRuleForm(rule));
  const source = ref(rule.source);

  const { isSaving, save } = useWorkshopSave(
    RULES_WORKSHOP_KEY,
    () => rule.id,
    {
      created: RULE_EDITOR_TEXT.saved,
      saved: RULE_EDITOR_TEXT.saved,
      error: RULE_EDITOR_TEXT.saveError,
    },
  );

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<RuleForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<RuleForm>): Promise<void> {
    const saved = await save(getRulePayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="ruleFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-1 gap-4 md:grid-cols-2"
    @submit="submit"
  >
    <WorkshopNameFields
      v-model:name="state.name"
      v-model:english-name="state.englishName"
      v-model:alt-name="state.altName"
    />

    <UFormField
      :label="RULE_EDITOR_TEXT.type"
      name="type"
      required
    >
      <UInput
        v-model="state.type"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="md:col-span-2"
      required
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="RULE_DESCRIPTION_ROWS"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.page"
      name="page"
    >
      <UInputNumber
        v-model="state.page"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-saving="isSaving"
      :cancel-to="WORKSHOP_ROUTE"
      class="md:col-span-2"
      is-editing
    />
  </UForm>
</template>
