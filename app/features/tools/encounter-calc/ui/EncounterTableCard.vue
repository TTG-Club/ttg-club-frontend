<script setup lang="ts">
  import type {
    EncounterSelectItem,
    EncounterTableRoll,
    EncounterTableTier,
  } from '../model';

  import { ContentRender } from '~content/render';

  import { TABLE_ROLL_TEXT } from '../model';

  /**
   * Бросок по таблицам случайных столкновений: диапазон уровней (по
   * умолчанию — по среднему уровню группы) и окружение. Под формой —
   * выпавшая строка таблицы.
   */
  const {
    tiers,
    environments,
    defaultTier,
    lastRoll = undefined,
    loading = false,
    disabled = false,
  } = defineProps<{
    tiers: Array<EncounterTableTier>;
    environments: Array<EncounterSelectItem>;
    defaultTier: number;
    lastRoll?: EncounterTableRoll;
    loading?: boolean;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    roll: [tier: number | undefined, environment: string | undefined];
  }>();

  /** Выбранный вручную диапазон; пока не выбран — по уровню группы. */
  const pickedTier = ref<number>();
  const environment = ref<string>();

  const tier = computed({
    get: () => pickedTier.value ?? defaultTier,
    set: (value: number) => {
      pickedTier.value = value;
    },
  });

  /** Бросает по таблице с выбранными диапазоном и окружением. */
  function submit(): void {
    if (loading || disabled) {
      return;
    }

    emit('roll', tier.value, environment.value);
  }
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="submit"
  >
    <div
      class="flex flex-wrap items-center gap-2 text-sm font-semibold text-highlighted"
    >
      <UIcon
        name="tabler:table"
        class="size-5 text-primary"
      />

      {{ TABLE_ROLL_TEXT.title }}

      <span class="ml-auto text-xs font-normal text-muted">
        {{ TABLE_ROLL_TEXT.hint }}
      </span>
    </div>

    <UFormField :label="TABLE_ROLL_TEXT.tier">
      <USelect
        v-model="tier"
        :items="tiers"
        value-key="value"
        label-key="label"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="TABLE_ROLL_TEXT.environment">
      <USelectMenu
        v-model="environment"
        :items="environments"
        :placeholder="TABLE_ROLL_TEXT.environmentPlaceholder"
        :search-input="false"
        value-key="value"
        clear
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      icon="tabler:dice-5"
      class="justify-center"
      :label="TABLE_ROLL_TEXT.submit"
      :loading
      :disabled
    />

    <article
      v-if="lastRoll"
      :key="lastRoll.id"
      class="flex flex-col gap-2 rounded-lg border border-default bg-elevated/50 p-3 text-sm"
    >
      <p v-if="lastRoll.sourceName">
        <b class="text-highlighted">{{ TABLE_ROLL_TEXT.source }}</b>
        {{ lastRoll.sourceName }}
      </p>

      <p v-if="lastRoll.tableName">
        <b class="text-highlighted">{{ TABLE_ROLL_TEXT.table }}</b>
        {{ lastRoll.tableName }}
      </p>

      <ContentRender :html="lastRoll.description" />

      <p
        v-if="lastRoll.addedCount"
        class="text-xs text-muted"
      >
        {{ TABLE_ROLL_TEXT.added }} {{ lastRoll.addedCount }}
      </p>
    </article>
  </form>
</template>
