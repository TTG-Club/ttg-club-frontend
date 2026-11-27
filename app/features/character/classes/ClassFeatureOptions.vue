<script setup lang="ts">
  import type { ClassFeatureOption } from '../model';

  import { hasContentDescription } from '~content/model';
  import { ContentRender } from '~content/render';

  import {
    CLASS_OPTIONS_TEXT,
    getClassFeatureOptionSearchText,
  } from '../model';

  /**
   * Варианты умения на странице класса, как в core-app: кнопка
   * «Воззвания (28)» открывает боковую панель с поиском и счётчиком
   * «Показано N / M»; каждый вариант — карточка с названием (ссылка на его
   * страницу в разделе «Особенности классов»), английским названием,
   * бейджами уровня и повторяемости, требованиями и описанием с разметкой.
   */
  const { name, options } = defineProps<{
    /** Название списка; пусто — «Варианты». */
    name: string | null | undefined;
    options: ReadonlyArray<ClassFeatureOption>;
  }>();

  const isOpen = ref(false);
  const wasOpened = ref(false);
  const search = ref('');

  const title = computed(() => name || CLASS_OPTIONS_TEXT.defaultName);

  const buttonLabel = computed(() =>
    CLASS_OPTIONS_TEXT.open(title.value, options.length),
  );

  // Текст для поиска собирается из описаний, поэтому карточки считаются
  // только после первого открытия панели — страница класса их не ждёт; после
  // закрытия они остаются, чтобы список не пропадал во время анимации
  const cards = computed(() =>
    wasOpened.value
      ? options.map((option) => ({
          option,
          searchText: getClassFeatureOptionSearchText(option),
          levelLabel: option.level
            ? CLASS_OPTIONS_TEXT.level(option.level)
            : '',
          hasDescription: hasContentDescription(option.description),
          ariaLabel: `${CLASS_OPTIONS_TEXT.openPage}: ${option.name}`,
        }))
      : [],
  );

  const filteredCards = computed(() => {
    const query = search.value.trim().toLocaleLowerCase();

    return query
      ? cards.value.filter((card) => card.searchText.includes(query))
      : cards.value;
  });

  const shownLabel = computed(() =>
    CLASS_OPTIONS_TEXT.shown(filteredCards.value.length, options.length),
  );

  function open(): void {
    wasOpened.value = true;
    isOpen.value = true;
  }

  function clearSearch(): void {
    search.value = '';
  }
</script>

<template>
  <div class="mt-2">
    <UButton
      :label="buttonLabel"
      icon="tabler:list-search"
      color="neutral"
      variant="subtle"
      @click.left.exact.prevent="open"
    />

    <USlideover
      v-model:open="isOpen"
      :title="title"
      :description="shownLabel"
      :ui="{
        content: 'w-full max-w-192 min-w-80',
        body: 'flex flex-col gap-4 p-4 sm:p-6',
      }"
    >
      <template #body>
        <UInput
          v-model="search"
          icon="tabler:search"
          :placeholder="CLASS_OPTIONS_TEXT.search"
          autocomplete="off"
          :ui="{ trailing: 'pe-0.5' }"
        >
          <template
            v-if="search"
            #trailing
          >
            <UButton
              icon="tabler:x"
              variant="link"
              color="neutral"
              size="sm"
              :aria-label="CLASS_OPTIONS_TEXT.clearSearch"
              @click.left.exact.prevent="clearSearch"
            />
          </template>
        </UInput>

        <div
          v-if="filteredCards.length"
          class="flex flex-col gap-3"
        >
          <article
            v-for="card in filteredCards"
            :key="card.option.url"
            class="rounded-lg border border-default bg-muted p-4"
          >
            <header class="mb-3 flex flex-wrap items-start gap-2">
              <div class="min-w-0 flex-1">
                <h5 class="text-base font-semibold text-highlighted">
                  <NuxtLink
                    :to="card.option.url"
                    class="hover:text-primary"
                    :aria-label="card.ariaLabel"
                  >
                    {{ card.option.name }}
                  </NuxtLink>
                </h5>

                <p
                  v-if="card.option.englishName"
                  class="text-sm text-muted"
                >
                  {{ card.option.englishName }}
                </p>
              </div>

              <UBadge
                v-if="card.option.repeatable"
                color="info"
                variant="subtle"
                size="sm"
              >
                {{ CLASS_OPTIONS_TEXT.repeatable }}
              </UBadge>

              <UBadge
                v-if="card.levelLabel"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ card.levelLabel }}
              </UBadge>
            </header>

            <p
              v-if="card.option.prerequisite"
              class="mb-3 border-l-2 border-default pl-3 text-sm text-muted"
            >
              {{ card.option.prerequisite }}
            </p>

            <p
              v-if="card.option.additional"
              class="mb-3 text-sm text-muted italic"
            >
              {{ card.option.additional }}
            </p>

            <ContentRender
              v-if="card.hasDescription"
              :content="card.option.description"
            />
          </article>
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-default bg-muted p-6 text-center text-sm text-muted"
        >
          {{ CLASS_OPTIONS_TEXT.empty }}
        </div>
      </template>
    </USlideover>
  </div>
</template>
