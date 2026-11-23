<script setup lang="ts">
  import type { ActiveEffect } from '~active-effects/model';

  import { ActiveEffectItem } from '~active-effects/editor';
  import { EFFECT_FORM_CONTEXT } from '~active-effects/model';

  import { EFFECTS_TEXT } from '../model';

  /**
   * Правка своего эффекта той же формой, какой мастерская правит эффекты
   * записей справочника. Правки применяются кнопкой.
   */
  const { effect } = defineProps<{
    effect: ActiveEffect | null;
  }>();

  const emit = defineEmits<{
    save: [effect: ActiveEffect];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const draft = ref<ActiveEffect | null>(null);

  watch(
    () => [isOpen.value, effect] as const,
    ([open, source]) => {
      if (open && source) {
        draft.value = { ...source };
      }
    },
    { immediate: true },
  );

  function save(): void {
    if (draft.value) {
      emit('save', draft.value);
    }

    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="draft?.name ?? EFFECTS_TEXT.addOwn"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <ActiveEffectItem
        v-if="draft"
        v-model="draft"
        :context="EFFECT_FORM_CONTEXT.ownEffects"
      />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="EFFECTS_TEXT.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="isOpen = false"
        />

        <UButton
          :label="EFFECTS_TEXT.save"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
