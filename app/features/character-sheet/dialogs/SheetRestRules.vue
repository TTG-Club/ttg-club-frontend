<script setup lang="ts">
  import { REST_TEXT } from '../model';

  /** Свёрнутая справка по правилам отдыха. */
  const { rules } = defineProps<{
    rules: ReadonlyArray<string>;
  }>();
</script>

<template>
  <UCollapsible class="flex flex-col gap-2">
    <UButton
      :label="REST_TEXT.rulesTitle"
      icon="tabler:book"
      trailing-icon="tabler:chevron-down"
      color="neutral"
      variant="subtle"
      size="sm"
      block
      class="group justify-between"
      :ui="{
        trailingIcon:
          'transition-transform duration-200 group-data-[state=open]:rotate-180',
      }"
    />

    <template #content>
      <ul class="flex flex-col gap-2 rounded-lg bg-elevated/40 p-3">
        <li
          v-for="rule in rules"
          :key="rule"
          class="flex gap-1.5 text-xs leading-relaxed text-toned"
        >
          <UIcon
            name="tabler:point-filled"
            class="mt-1 size-3 shrink-0 text-primary"
          />

          <span>{{ rule }}</span>
        </li>
      </ul>
    </template>
  </UCollapsible>
</template>
