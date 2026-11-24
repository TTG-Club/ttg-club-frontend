<script setup lang="ts">
  import type { ClassFeatureOption } from '../model';

  import { hasContentDescription } from '~content/model';
  import { ContentRender } from '~content/render';

  import { CLASS_OPTIONS_TEXT } from '../model';

  /**
   * Варианты умения на странице класса, как на new.ttg.club: кнопка
   * «Воззвания (28)» открывает боковую панель с поиском; у варианта —
   * название-ссылка на его страницу в разделе «Особенности классов»,
   * уровень, требования и раскрываемое описание.
   */
  const { name, options } = defineProps<{
    /** Название списка; пусто — «Варианты». */
    name: string | null | undefined;
    options: ReadonlyArray<ClassFeatureOption>;
  }>();

  const isOpen = ref(false);
  const search = ref('');
  const expanded = ref<Array<string>>([]);

  const title = computed(() => name || CLASS_OPTIONS_TEXT.defaultName);

  const buttonLabel = computed(() =>
    CLASS_OPTIONS_TEXT.open(title.value, options.length),
  );

  const rows = computed(() => {
    const query = search.value.trim().toLowerCase();

    return options
      .filter(
        (option) =>
          !query
          || option.name.toLowerCase().includes(query)
          || (option.englishName ?? '').toLowerCase().includes(query),
      )
      .map((option) => ({
        option,
        caption: [
          option.level ? CLASS_OPTIONS_TEXT.level(option.level) : '',
          option.prerequisite ?? '',
          option.additional ?? '',
        ]
          .filter(Boolean)
          .join(' · '),
        hasDescription: hasContentDescription(option.description),
        isExpanded: expanded.value.includes(option.url),
        chevronClass: expanded.value.includes(option.url) ? 'rotate-180' : '',
      }));
  });

  function open(): void {
    isOpen.value = true;
  }

  /**
   * Раскрывает или сворачивает описание варианта.
   * @param url - адрес варианта
   */
  function toggle(url: string): void {
    expanded.value = expanded.value.includes(url)
      ? expanded.value.filter((entry) => entry !== url)
      : [...expanded.value, url];
  }
</script>

<template>
  <div class="mt-2">
    <UButton
      :label="buttonLabel"
      icon="tabler:list-details"
      color="primary"
      variant="soft"
      size="sm"
      @click.left.exact.prevent="open"
    />

    <USlideover
      v-model:open="isOpen"
      :title="title"
    >
      <template #body>
        <div class="flex flex-col gap-2">
          <UInput
            v-model="search"
            icon="tabler:search"
            :placeholder="CLASS_OPTIONS_TEXT.search"
            type="search"
            autocomplete="off"
          />

          <p
            v-if="!rows.length"
            class="py-6 text-center text-sm text-dimmed"
          >
            {{ CLASS_OPTIONS_TEXT.empty }}
          </p>

          <div
            v-for="row in rows"
            :key="row.option.url"
            class="flex flex-col rounded-lg border border-default/50 bg-elevated/20"
          >
            <div class="flex items-start gap-2 p-2">
              <div class="flex min-w-0 grow flex-col">
                <span class="flex items-center gap-2">
                  <NuxtLink
                    :to="row.option.url"
                    class="truncate text-sm font-medium text-highlighted hover:text-primary"
                    :aria-label="`${CLASS_OPTIONS_TEXT.openPage}: ${row.option.name}`"
                  >
                    {{ row.option.name }}
                  </NuxtLink>

                  <UTooltip
                    v-if="row.option.repeatable"
                    :text="CLASS_OPTIONS_TEXT.repeatable"
                  >
                    <UIcon
                      name="tabler:repeat"
                      class="size-4 shrink-0 text-muted"
                    />
                  </UTooltip>
                </span>

                <span
                  v-if="row.caption"
                  class="text-xs text-dimmed"
                >
                  {{ row.caption }}
                </span>
              </div>

              <UButton
                v-if="row.hasDescription"
                icon="tabler:chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                :aria-label="`${CLASS_OPTIONS_TEXT.expand}: ${row.option.name}`"
                :aria-expanded="row.isExpanded"
                :class="row.chevronClass"
                @click.left.exact.prevent="toggle(row.option.url)"
              />
            </div>

            <div
              v-if="row.isExpanded && row.option.description"
              class="border-t border-default/50 px-3 py-2 text-sm"
            >
              <ContentRender :content="row.option.description" />
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
