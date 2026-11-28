<script setup lang="ts">
  import type { CreatureOption } from '~tools/initiative/model';

  import type {
    CustomCreatureDraft,
    EncounterCreature,
    EncounterCreatureOption,
  } from '../model';

  import { useCreatureSearch } from '~tools/initiative/composables';

  import {
    CREATURE_LABELS,
    CUSTOM_CREATURE_LABELS,
    formatExperience,
    getExperienceByChallengeRating,
    MAX_ROW_COUNT,
    MIN_ROW_COUNT,
    TRANSFER_LABELS,
  } from '../model';
  import EncounterCustomCreatureForm from './EncounterCustomCreatureForm.vue';
  import EncounterNumberInput from './EncounterNumberInput.vue';

  const { creatures, canAdd = true } = defineProps<{
    creatures: Array<EncounterCreature>;
    canAdd?: boolean;
  }>();

  const emit = defineEmits<{
    'add': [option: EncounterCreatureOption, count: number];
    'add-custom': [draft: CustomCreatureDraft];
    'update': [id: string, count: number];
    'remove': [id: string];
    'clear': [];
    'transfer': [];
  }>();

  const { searchTerm, options, isLoading } = useCreatureSearch();

  const selected = ref<CreatureOption>();
  const batchCount = ref(MIN_ROW_COUNT);
  const [isCustomFormOpen, toggleCustomForm] = useToggle(false);

  const emptyLabel = computed(() =>
    searchTerm.value.trim()
      ? CREATURE_LABELS.notFound
      : CREATURE_LABELS.searchHint,
  );

  const rows = computed(() =>
    creatures.map((creature) => ({
      ...creature,
      details: `${CREATURE_LABELS.challengeRating} ${creature.challengeRating} · ${CREATURE_LABELS.experience} ${formatExperience(creature.experience)} · ${CREATURE_LABELS.total} ${formatExperience(creature.experience * creature.count)}`,
    })),
  );

  /** Добавляет выбранное существо в столкновение и очищает форму поиска. */
  function submit(): void {
    if (!selected.value || !canAdd) {
      return;
    }

    const { value, label, challengeRating } = selected.value;

    emit(
      'add',
      {
        url: value,
        label,
        type: '',
        challengeRating,
        experience: getExperienceByChallengeRating(challengeRating),
      },
      batchCount.value,
    );

    selected.value = undefined;
    searchTerm.value = '';
    batchCount.value = MIN_ROW_COUNT;
  }
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
  >
    <div
      class="flex flex-wrap items-center gap-2 text-sm font-semibold text-highlighted"
    >
      <UIcon
        name="tabler:paw"
        class="size-5 text-primary"
      />

      {{ CREATURE_LABELS.title }}

      <div class="ml-auto flex flex-wrap gap-1">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="tabler:pencil-plus"
          :label="CUSTOM_CREATURE_LABELS.toggle"
          :aria-expanded="isCustomFormOpen"
          @click.left.exact.prevent="toggleCustomForm()"
        />

        <UButton
          v-if="creatures.length"
          size="xs"
          variant="soft"
          icon="tabler:swords"
          :label="TRANSFER_LABELS.button"
          :aria-label="TRANSFER_LABELS.buttonAria"
          @click.left.exact.prevent="emit('transfer')"
        />

        <UButton
          v-if="creatures.length"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="tabler:eraser"
          :label="CREATURE_LABELS.clear"
          @click.left.exact.prevent="emit('clear')"
        />
      </div>
    </div>

    <form
      class="flex flex-wrap items-end gap-2"
      @submit.prevent="submit"
    >
      <UFormField
        :label="CREATURE_LABELS.search"
        class="min-w-48 flex-1"
      >
        <UInputMenu
          v-model="selected"
          v-model:search-term="searchTerm"
          :items="options"
          :loading="isLoading"
          ignore-filter
          by="value"
          label-key="label"
          :placeholder="CREATURE_LABELS.searchPlaceholder"
          icon="tabler:search"
          class="w-full"
          :disabled="!canAdd"
        >
          <template #item-trailing="{ item: option }">
            <UBadge
              v-if="option.challengeRating"
              size="sm"
              color="neutral"
              variant="subtle"
            >
              {{ CREATURE_LABELS.challengeRating }} {{ option.challengeRating }}
            </UBadge>
          </template>

          <template #empty>
            <span class="text-sm text-muted">
              {{ emptyLabel }}
            </span>
          </template>
        </UInputMenu>
      </UFormField>

      <UFormField
        :label="CREATURE_LABELS.count"
        class="shrink-0"
      >
        <EncounterNumberInput
          v-model="batchCount"
          :min="MIN_ROW_COUNT"
          :max="MAX_ROW_COUNT"
          :disabled="!canAdd"
          class="w-24"
        />
      </UFormField>

      <UButton
        type="submit"
        icon="tabler:plus"
        class="shrink-0 max-sm:grow max-sm:justify-center"
        :disabled="!selected || !canAdd"
        :aria-label="CREATURE_LABELS.addAria"
      />
    </form>

    <UCollapsible v-model:open="isCustomFormOpen">
      <template #content>
        <EncounterCustomCreatureForm
          :disabled="!canAdd"
          @add="emit('add-custom', $event)"
        />
      </template>
    </UCollapsible>

    <p
      v-if="!rows.length"
      class="text-sm text-muted"
    >
      {{ CREATURE_LABELS.emptyList }}
    </p>

    <ul
      v-else
      class="flex flex-col divide-y divide-default"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 py-2"
      >
        <div class="flex min-w-40 flex-1 flex-col">
          <ULink
            v-if="row.url"
            :to="row.url"
            target="_blank"
            class="font-medium text-highlighted hover:text-primary"
          >
            {{ row.name }}
          </ULink>

          <span
            v-else
            class="flex items-center gap-2 font-medium text-highlighted"
          >
            {{ row.name }}

            <UBadge
              size="sm"
              color="neutral"
              variant="subtle"
            >
              {{ CUSTOM_CREATURE_LABELS.badge }}
            </UBadge>
          </span>

          <span class="text-xs text-muted tabular-nums">
            {{ row.details }}
          </span>
        </div>

        <EncounterNumberInput
          :model-value="row.count"
          :min="MIN_ROW_COUNT"
          :max="MAX_ROW_COUNT"
          class="w-24"
          :aria-label="CREATURE_LABELS.countAria"
          @update:model-value="emit('update', row.id, $event)"
        />

        <UButton
          icon="tabler:trash"
          color="neutral"
          variant="ghost"
          :aria-label="CREATURE_LABELS.removeAria"
          @click.left.exact.prevent="emit('remove', row.id)"
        />
      </li>
    </ul>
  </section>
</template>
