<script setup lang="ts">
  import type { EncounterPartyRow } from '../model';

  import {
    MAX_CHARACTER_LEVEL,
    MAX_ROW_COUNT,
    MIN_CHARACTER_LEVEL,
    MIN_ROW_COUNT,
    PARTY_LABELS,
  } from '../model';
  import EncounterNumberInput from './EncounterNumberInput.vue';

  const { party, canAdd = true } = defineProps<{
    party: Array<EncounterPartyRow>;
    canAdd?: boolean;
  }>();

  const emit = defineEmits<{
    add: [];
    update: [
      id: string,
      patch: Partial<Pick<EncounterPartyRow, 'level' | 'count'>>,
    ];
    remove: [id: string];
  }>();

  const characterCount = computed(() =>
    party.reduce((total, row) => total + row.count, 0),
  );
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:users"
        class="size-5 text-primary"
      />

      {{ PARTY_LABELS.title }}

      <span class="ml-auto text-xs font-normal text-muted tabular-nums">
        {{ PARTY_LABELS.characters }}: {{ characterCount }}
      </span>
    </div>

    <p
      v-if="!party.length"
      class="text-sm text-muted"
    >
      {{ PARTY_LABELS.empty }}
    </p>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="row in party"
        :key="row.id"
        class="flex items-end gap-2"
      >
        <UFormField
          :label="PARTY_LABELS.characters"
          class="flex-1"
        >
          <EncounterNumberInput
            :model-value="row.count"
            :min="MIN_ROW_COUNT"
            :max="MAX_ROW_COUNT"
            class="w-full"
            @update:model-value="emit('update', row.id, { count: $event })"
          />
        </UFormField>

        <UFormField
          :label="PARTY_LABELS.level"
          class="flex-1"
        >
          <EncounterNumberInput
            :model-value="row.level"
            :min="MIN_CHARACTER_LEVEL"
            :max="MAX_CHARACTER_LEVEL"
            class="w-full"
            @update:model-value="emit('update', row.id, { level: $event })"
          />
        </UFormField>

        <UButton
          icon="tabler:trash"
          color="neutral"
          variant="ghost"
          :aria-label="PARTY_LABELS.removeAria"
          @click.left.exact.prevent="emit('remove', row.id)"
        />
      </li>
    </ul>

    <UButton
      icon="tabler:plus"
      variant="soft"
      class="self-start"
      :label="PARTY_LABELS.add"
      :disabled="!canAdd"
      @click.left.exact.prevent="emit('add')"
    />
  </section>
</template>
