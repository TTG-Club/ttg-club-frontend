<script setup lang="ts">
  import type { NameComponent, NameGenerationType, NameSex } from '../model';

  import { useToolGenerator } from '../composables';
  import {
    ToolChip,
    ToolCloseButton,
    ToolCountField,
    ToolGenerator,
  } from '../generator';
  import {
    buildNameRaceGroups,
    buildNamesRequest,
    getNameSharedHint,
    NAME_COMPONENTS,
    NAME_COUNT_DEFAULT,
    NAME_GENERATION_TYPES,
    NAME_SEX_LABEL,
    NAME_SEXES,
    nameRacesSchema,
    nameResultSchema,
    NAMES_TEXT,
    toggleRequired,
    TOOLS_API_URL,
  } from '../model';

  /**
   * Генератор имён: одно имя или группа, семья, клан, дом с общей частью.
   * Расы можно не выбирать — тогда бэкенд берёт любую с именами.
   */
  const { data: races } = await useAsyncData(
    'tools-names-races',
    async () => nameRacesSchema.parse(await $fetch(TOOLS_API_URL.names)),
    { deep: false, default: () => [] },
  );

  const typeItems = [...NAME_GENERATION_TYPES];

  const raceGroups = computed(() => buildNameRaceGroups(races.value));

  const type = ref<NameGenerationType>('SINGLE');
  const count = ref(NAME_COUNT_DEFAULT);
  const raceIds = ref<Array<number>>([]);

  const components = ref<Array<NameComponent>>(
    NAME_COMPONENTS.map((item) => item.value),
  );

  const sexes = ref<Array<NameSex>>(['MALE', 'FEMALE']);

  const isSingle = computed(() => type.value === 'SINGLE');

  const sharedHint = computed(() => getNameSharedHint(type.value));

  // У семьи, клана и дома состав имени задан самой генерацией
  const isComponentsLocked = computed(() => !!sharedHint.value);

  const { results, isPending, generate, clear, remove } = useToolGenerator(
    async (signal) => {
      const body = buildNamesRequest({
        type: type.value,
        components: components.value,
        count: count.value,
        raceIds: raceIds.value,
        sexes: sexes.value,
      });

      return nameResultSchema
        .array()
        .parse(
          await $fetch(TOOLS_API_URL.names, { method: 'POST', body, signal }),
        );
    },
  );

  const hasResults = computed(() => results.value.length > 0);

  /**
   * Переключает часть имени; последнюю снять нельзя.
   * @param value - часть имени
   */
  function toggleComponent(value: NameComponent): void {
    components.value = toggleRequired(components.value, value);
  }

  /**
   * Переключает пол; последний снять нельзя.
   * @param value - пол
   */
  function toggleSex(value: NameSex): void {
    sexes.value = toggleRequired(sexes.value, value);
  }
</script>

<template>
  <ToolGenerator
    :title="NAMES_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clear"
  >
    <template #form>
      <UFormField :label="NAMES_TEXT.type">
        <USelect
          v-model="type"
          :items="typeItems"
          class="w-full"
        />
      </UFormField>

      <ToolCountField
        v-if="!isSingle"
        v-model="count"
      />

      <UFormField :label="NAMES_TEXT.races">
        <USelectMenu
          v-model="raceIds"
          :items="raceGroups"
          :placeholder="NAMES_TEXT.racesPlaceholder"
          value-key="value"
          multiple
          clear
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="NAMES_TEXT.components"
        :help="sharedHint"
      >
        <div class="flex flex-wrap gap-2">
          <ToolChip
            v-for="item in NAME_COMPONENTS"
            :key="item.value"
            :label="item.label"
            :is-selected="components.includes(item.value)"
            :is-disabled="isComponentsLocked"
            @toggle="toggleComponent(item.value)"
          />
        </div>
      </UFormField>

      <UFormField :label="NAMES_TEXT.sexes">
        <div class="flex flex-wrap gap-2">
          <ToolChip
            v-for="item in NAME_SEXES"
            :key="item.value"
            :label="item.label"
            :is-selected="sexes.includes(item.value)"
            @toggle="toggleSex(item.value)"
          />
        </div>
      </UFormField>
    </template>

    <div class="@container">
      <div class="grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
        <article
          v-for="result in results"
          :key="result.id"
          class="flex flex-col gap-2 rounded-xl border border-default bg-elevated/50 p-4"
        >
          <div class="flex items-start gap-2">
            <p class="min-w-0 flex-auto text-lg text-highlighted">
              {{ result.value.value }}
            </p>

            <ToolCloseButton @close="remove(result.id)" />
          </div>

          <div class="flex flex-wrap gap-1.5">
            <UBadge
              :label="result.value.race"
              color="neutral"
              variant="subtle"
            />

            <UBadge
              v-if="result.value.sex"
              :label="NAME_SEX_LABEL[result.value.sex]"
              color="neutral"
              variant="subtle"
            />
          </div>
        </article>
      </div>
    </div>
  </ToolGenerator>
</template>
