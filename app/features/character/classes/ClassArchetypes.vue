<script setup lang="ts">
  import type { ClassDetail, TypedLink } from '../model';

  import { getEntryApiPath } from '~section/model';

  import { CLASS_TEXT, classDetailSchema } from '../model';
  import ClassArchetypeDetail from './ClassArchetypeDetail.vue';

  /**
   * Архетипы под умениями класса: каждый под спойлером, а его умения
   * грузятся при первом раскрытии, как в старом SPA.
   */
  const { archetypes } = defineProps<{
    archetypes: Array<TypedLink>;
  }>();

  const details = shallowRef<Record<string, ClassDetail>>({});
  const loading = shallowRef<ReadonlySet<string>>(new Set());
  const failed = shallowRef<ReadonlySet<string>>(new Set());

  /**
   * Загружает архетип, если его ещё нет.
   * @param url - адрес архетипа
   */
  async function load(url: string) {
    if (details.value[url] || loading.value.has(url)) {
      return;
    }

    loading.value = new Set([...loading.value, url]);
    failed.value = new Set([...failed.value].filter((item) => item !== url));

    try {
      const detail = classDetailSchema.parse(
        await $fetch(getEntryApiPath(url), { method: 'POST' }),
      );

      details.value = { ...details.value, [url]: detail };
    } catch {
      failed.value = new Set([...failed.value, url]);
    } finally {
      loading.value = new Set(
        [...loading.value].filter((item) => item !== url),
      );
    }
  }

  /**
   * Раскрытый спойлер подгружает свой архетип.
   * @param event - событие `toggle` у `details`
   * @param url - адрес архетипа
   */
  function handleToggle(event: Event, url: string) {
    if (event.target instanceof HTMLDetailsElement && event.target.open) {
      load(url);
    }
  }

  const items = computed(() =>
    archetypes.map((archetype) => ({
      archetype,
      detail: details.value[archetype.url],
      isLoading: loading.value.has(archetype.url),
      isFailed: failed.value.has(archetype.url),
    })),
  );
</script>

<template>
  <section class="mt-6">
    <h4>{{ CLASS_TEXT.subclasses }}</h4>

    <details
      v-for="item in items"
      :key="item.archetype.url"
      class="spoiler feet_show"
      @toggle="handleToggle($event, item.archetype.url)"
    >
      <summary class="h4">
        <span>{{ item.archetype.name.rus }}</span>

        <UTooltip
          v-if="item.archetype.source"
          :text="item.archetype.source.name"
        >
          <span class="source-data">{{ item.archetype.source.shortName }}</span>
        </UTooltip>
      </summary>

      <div class="content">
        <div
          v-if="item.isLoading"
          class="flex flex-col gap-2"
        >
          <USkeleton
            v-for="index in 3"
            :key="index"
            class="h-5 w-full"
          />
        </div>

        <p v-else-if="item.isFailed">
          {{ CLASS_TEXT.archetypeLoadError }}
        </p>

        <ClassArchetypeDetail
          v-else-if="item.detail"
          :archetype="item.detail"
        />
      </div>
    </details>
  </section>
</template>
