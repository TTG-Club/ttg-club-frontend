<script setup lang="ts">
  import type { HtmlEditorLink } from '../model';

  import { HTML_EDITOR_TEXT } from '../model';

  /**
   * Окно ссылки: адрес и текст. Путь записи раздела (`/spells/…`) станет
   * ссылкой, которая открывает карточку.
   */
  const { link, isEditing } = defineProps<{
    /** Ссылка, с которой окно открывается. */
    link: HtmlEditorLink;
    /** Правится уже вставленная ссылка: её можно снять. */
    isEditing: boolean;
  }>();

  const emit = defineEmits<{
    apply: [link: HtmlEditorLink];
    remove: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const form = reactive<HtmlEditorLink>({ text: '', url: '' });

  const isValid = computed(() => !!form.url.trim());

  const title = computed(() =>
    isEditing ? HTML_EDITOR_TEXT.linkEditTitle : HTML_EDITOR_TEXT.linkTitle,
  );

  const submitLabel = computed(() =>
    isEditing ? HTML_EDITOR_TEXT.save : HTML_EDITOR_TEXT.insert,
  );

  // Каждое открытие начинается с переданной ссылки
  watch(isOpen, (opened) => {
    if (opened) {
      Object.assign(form, link);
    }
  });

  function close(): void {
    isOpen.value = false;
  }

  function submit(): void {
    if (!isValid.value) {
      return;
    }

    emit('apply', { text: form.text.trim(), url: form.url.trim() });
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
        <UFormField :label="HTML_EDITOR_TEXT.linkUrl">
          <UInput
            v-model="form.url"
            :placeholder="HTML_EDITOR_TEXT.linkUrlPlaceholder"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField :label="HTML_EDITOR_TEXT.linkText">
          <UInput
            v-model="form.text"
            :placeholder="HTML_EDITOR_TEXT.linkTextPlaceholder"
            class="w-full"
          />
        </UFormField>

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
