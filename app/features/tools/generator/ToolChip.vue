<script setup lang="ts">
  /** Переключатель варианта настроек: вид безумия, книга. */
  const {
    label,
    isSelected = false,
    isDisabled = false,
  } = defineProps<{
    label: string;
    isSelected?: boolean;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    toggle: [];
  }>();

  const variant = computed(() => (isSelected ? 'solid' : 'outline'));

  const color = computed(() => (isSelected ? 'primary' : 'neutral'));

  function toggle(): void {
    emit('toggle');
  }
</script>

<template>
  <UButton
    :label="label"
    :variant="variant"
    :color="color"
    :aria-pressed="isSelected"
    :disabled="isDisabled"
    size="sm"
    class="rounded-full"
    @click.left.exact.prevent="toggle"
  />
</template>
