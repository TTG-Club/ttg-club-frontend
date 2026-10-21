<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import type { ClassLink } from '../model';

  import { getQueryString, SEARCH_QUERY_KEY } from '~section/model';

  import { CharacterLinkCard } from '../link-card';
  import { CLASS_TEXT, getClassIcon } from '../model';

  /**
   * Карточка класса в списке: значок, кость хитов, книга и архетипы.
   * Архетипы раскрыты у открытого класса и после поиска: поиск находит
   * классы по их архетипам.
   */
  const { classLink, to = undefined } = defineProps<{
    classLink: ClassLink;
    to?: RouteLocationRaw;
  }>();

  const route = useRoute();

  const icon = computed(() => getClassIcon(classLink.icon));

  const archetypesLabel = computed(
    () => classLink.archetypeName ?? CLASS_TEXT.archetypes,
  );

  const hasSearch = computed(
    () => !!getQueryString(route.query[SEARCH_QUERY_KEY]),
  );

  const isOpen = computed(
    () =>
      route.path === classLink.url
      || route.path.startsWith(`${classLink.url}/`),
  );

  /** Архетипы раскрыты сразу у открытого класса и после поиска. */
  function isInitiallyExpanded() {
    return isOpen.value || hasSearch.value;
  }

  const isExpanded = ref(isInitiallyExpanded());

  watch(hasSearch, (value) => {
    isExpanded.value = value;
  });

  // Выбранный класс раскрывает свои архетипы, как в старом SPA
  watch(isOpen, (value) => {
    if (value) {
      isExpanded.value = true;
    }
  });
</script>

<template>
  <CharacterLinkCard
    v-model:expanded="isExpanded"
    :name="classLink.name"
    :url="classLink.url"
    :image="classLink.image"
    :to="to"
    :links="classLink.archetypes"
    :links-label="archetypesLabel"
    :show-label="CLASS_TEXT.showArchetypes"
    :hide-label="CLASS_TEXT.hideArchetypes"
  >
    <template
      v-if="icon"
      #icon
    >
      <UIcon
        :name="icon"
        class="size-8 shrink-0 text-primary"
      />
    </template>

    <template #badges>
      <UBadge
        v-if="classLink.dice"
        :label="classLink.dice"
        variant="solid"
        size="sm"
        class="rounded-full"
      />

      <UTooltip :text="classLink.source.name">
        <UBadge
          :label="classLink.source.shortName"
          variant="solid"
          size="sm"
          class="rounded-full"
        />
      </UTooltip>
    </template>
  </CharacterLinkCard>
</template>
