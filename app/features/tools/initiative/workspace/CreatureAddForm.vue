<script setup lang="ts">
  import type { AddCreatureRequest, CreatureOption } from '../model';

  import { useCreatureSearch } from '../composables';
  import { INITIATIVE_ICON, INITIATIVE_LIMIT, INITIATIVE_TEXT } from '../model';

  /** Добавление существ бестиария: поиск, количество и своё имя. */
  const { isDisabled = false, remaining = 0 } = defineProps<{
    isDisabled?: boolean;
    /** Сколько ещё существ можно добавить. */
    remaining?: number;
  }>();

  const emit = defineEmits<{
    add: [body: AddCreatureRequest];
  }>();

  const { searchTerm, options, isLoading } = useCreatureSearch();

  const creature = ref<CreatureOption>();
  const count = ref<number>(INITIATIVE_LIMIT.batchMin);
  const name = ref('');

  const isLimited = computed(() => remaining <= 0);

  const maxCount = computed(() =>
    Math.max(INITIATIVE_LIMIT.batchMin, remaining),
  );

  // Выбранное существо остаётся в списке, даже когда поиск его уже не находит
  const items = computed(() => {
    const selected = creature.value;

    if (
      !selected
      || options.value.some((item) => item.value === selected.value)
    ) {
      return options.value;
    }

    return [selected, ...options.value];
  });

  const isSubmitDisabled = computed(
    () => isDisabled || isLimited.value || !creature.value,
  );

  function submit(): void {
    if (isSubmitDisabled.value || !creature.value) {
      return;
    }

    const override = name.value.trim();

    emit('add', {
      type: 'CREATURE',
      creatureUrl: creature.value.value,
      count: Math.min(count.value, maxCount.value),
      ...(override ? { name: override } : {}),
    });

    creature.value = undefined;
    searchTerm.value = '';
    name.value = '';
    count.value = INITIATIVE_LIMIT.batchMin;
  }
</script>

<template>
  <form
    class="flex flex-col gap-3"
    @submit.prevent="submit"
  >
    <UFormField :label="INITIATIVE_TEXT.creature">
      <USelectMenu
        v-model="creature"
        v-model:search-term="searchTerm"
        :items="items"
        :loading="isLoading"
        :placeholder="INITIATIVE_TEXT.creaturePlaceholder"
        :disabled="isLimited"
        ignore-filter
        class="w-full"
      >
        <template #item-trailing="{ item }">
          <span class="text-xs text-muted">
            {{ INITIATIVE_TEXT.challengeRating }} {{ item.challengeRating }}
          </span>
        </template>

        <template #empty>
          {{ INITIATIVE_TEXT.creatureEmpty }}
        </template>
      </USelectMenu>
    </UFormField>

    <UFormField :label="INITIATIVE_TEXT.count">
      <UInputNumber
        v-model="count"
        :min="INITIATIVE_LIMIT.batchMin"
        :max="maxCount"
        :disabled="isLimited"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="INITIATIVE_TEXT.nameOverride">
      <UInput
        v-model="name"
        :maxlength="INITIATIVE_LIMIT.name"
        :disabled="isLimited"
        class="w-full"
      />
    </UFormField>

    <p
      v-if="isLimited"
      class="text-sm text-warning"
    >
      {{ INITIATIVE_TEXT.creaturesLimit }}
    </p>

    <UButton
      type="submit"
      :label="INITIATIVE_TEXT.add"
      :icon="INITIATIVE_ICON.add"
      :disabled="isSubmitDisabled"
      color="neutral"
      variant="subtle"
      block
    />
  </form>
</template>
