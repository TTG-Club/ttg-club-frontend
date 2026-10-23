<script setup lang="ts">
  import type { DiceToken } from '../model';

  import {
    createDiceToken,
    DICE_LABEL_OPTIONS,
    DICE_VARIANT_OPTIONS,
    HTML_EDITOR_TEXT,
  } from '../model';

  /**
   * Окно броска: формула и текст, а для расширенного броска ещё подпись,
   * вид и источник.
   */
  const { token, isEditing, isExtended } = defineProps<{
    /** Бросок, с которым окно открывается. */
    token: DiceToken;
    /** Правится уже вставленный бросок: можно удалить. */
    isEditing: boolean;
    isExtended: boolean;
  }>();

  const emit = defineEmits<{
    apply: [token: DiceToken];
    remove: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const form = reactive<DiceToken>(createDiceToken());

  const labelItems = ref<Array<string>>([...DICE_LABEL_OPTIONS]);

  const isValid = computed(() => !!form.formula.trim());

  const title = computed(() => {
    if (isEditing) {
      return HTML_EDITOR_TEXT.editTitle;
    }

    return isExtended ? HTML_EDITOR_TEXT.rollTitle : HTML_EDITOR_TEXT.diceTitle;
  });

  const submitLabel = computed(() =>
    isEditing ? HTML_EDITOR_TEXT.save : HTML_EDITOR_TEXT.insert,
  );

  // Каждое открытие начинается с переданного броска
  watch(isOpen, (opened) => {
    if (opened) {
      Object.assign(form, token);
    }
  });

  function close(): void {
    isOpen.value = false;
  }

  function addLabel(label: string): void {
    labelItems.value = [...labelItems.value, label];
    form.label = label;
  }

  function submit(): void {
    if (!isValid.value) {
      return;
    }

    const formula = form.formula.trim();

    emit(
      'apply',
      createDiceToken({
        formula,
        text: form.text.trim() || formula,
        label: form.label.trim(),
        source: form.source.trim(),
        variant: form.variant,
      }),
    );
  }

  function handleRemove(): void {
    emit('remove');
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-md', footer: 'justify-end' }"
  >
    <template #body>
      <form
        class="flex flex-col gap-4"
        @submit.prevent="submit"
      >
        <UFormField :label="HTML_EDITOR_TEXT.formula">
          <UInput
            v-model="form.formula"
            :placeholder="HTML_EDITOR_TEXT.formulaPlaceholder"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField :label="HTML_EDITOR_TEXT.text">
          <UInput
            v-model="form.text"
            :placeholder="HTML_EDITOR_TEXT.textPlaceholder"
            class="w-full"
          />
        </UFormField>

        <template v-if="isExtended">
          <UFormField :label="HTML_EDITOR_TEXT.label">
            <UInputMenu
              v-model="form.label"
              :items="labelItems"
              create-item
              class="w-full"
              @create="addLabel"
            />
          </UFormField>

          <UFormField :label="HTML_EDITOR_TEXT.variant">
            <URadioGroup
              v-model="form.variant"
              :items="DICE_VARIANT_OPTIONS"
              orientation="horizontal"
              :ui="{ fieldset: 'flex-wrap gap-x-4 gap-y-2' }"
            />
          </UFormField>

          <UFormField :label="HTML_EDITOR_TEXT.source">
            <UInput
              v-model="form.source"
              :placeholder="HTML_EDITOR_TEXT.sourcePlaceholder"
              class="w-full"
            />
          </UFormField>
        </template>

        <!-- Enter в поле отправляет форму -->
        <button
          type="submit"
          class="hidden"
        />
      </form>
    </template>

    <template #footer>
      <UButton
        v-if="isEditing"
        :label="HTML_EDITOR_TEXT.remove"
        color="error"
        variant="subtle"
        class="mr-auto"
        @click.left.exact.prevent="handleRemove"
      />

      <UButton
        :label="HTML_EDITOR_TEXT.cancel"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close"
      />

      <UButton
        :label="submitLabel"
        :disabled="!isValid"
        @click.left.exact.prevent="submit"
      />
    </template>
  </UModal>
</template>
