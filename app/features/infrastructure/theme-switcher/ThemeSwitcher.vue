<script setup lang="ts">
  import { THEME_OPTIONS } from '~/shared/consts';

  const { mode, change } = useTheme();

  const currentOption = computed(() => THEME_OPTIONS[mode.value]);

  function switchTheme() {
    change(currentOption.value.next);
  }
</script>

<template>
  <UTooltip :text="currentOption.label">
    <UButton
      :icon="currentOption.icon"
      :aria-label="currentOption.label"
      color="neutral"
      variant="ghost"
      @click.left.exact.prevent="switchTheme"
    />
  </UTooltip>
</template>
