<script setup lang="ts">
  import { INITIATIVE_LIMIT, INITIATIVE_TEXT } from '../model';

  /**
   * КД участника: у существа из статблока, игроку ведущий задаёт его сам.
   */
  const {
    value = undefined,
    isEditable = false,
    isDisabled = false,
  } = defineProps<{
    /** КД; у существа без статблока — `undefined`. */
    value?: number;
    /** КД задаётся вручную. */
    isEditable?: boolean;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    change: [value: number];
  }>();

  const isOpen = ref(false);

  const draft = ref<number>();

  const label = computed(() => (value === undefined ? '—' : String(value)));

  watch(isOpen, (open) => {
    if (open) {
      draft.value = value;
    }
  });

  function apply(): void {
    isOpen.value = false;

    if (draft.value !== undefined && draft.value !== value) {
      emit('change', draft.value);
    }
  }
</script>

<template>
  <UPopover
    v-if="isEditable"
    v-model:open="isOpen"
  >
    <UButton
      :label="label"
      :disabled="isDisabled"
      :aria-label="INITIATIVE_TEXT.changeArmorClass"
      color="neutral"
      variant="subtle"
      class="min-w-10 justify-center font-semibold tabular-nums"
    />

    <template #content>
      <form
        class="flex w-56 items-end gap-2 p-3"
        @submit.prevent="apply"
      >
        <UFormField
          :label="INITIATIVE_TEXT.armorClass"
          class="flex-auto"
        >
          <UInputNumber
            v-model="draft"
            :min="INITIATIVE_LIMIT.armorClassMin"
            :max="INITIATIVE_LIMIT.armorClassMax"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          :label="INITIATIVE_TEXT.ok"
          color="neutral"
          variant="subtle"
        />
      </form>
    </template>
  </UPopover>

  <span
    v-else
    class="flex h-8 min-w-10 items-center justify-center font-semibold text-highlighted tabular-nums"
  >
    {{ label }}
  </span>
</template>
