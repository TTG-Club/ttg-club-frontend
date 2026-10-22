<script setup lang="ts">
  import type { EntryName } from '~section/model';

  import type { TypedLink } from '../model';

  import { useSectionOpener } from '~section/composables';

  import { groupByBookType, LINK_CARD_ICON } from '../model';

  /**
   * Карточка расы или класса в списке: картинка с градиентом, названия и
   * метки. Кнопка в углу раскрывает разновидности или архетипы,
   * сгруппированные по типу книги. Клик открывает запись так, как велит
   * режим раздела, а вне раздела ведёт на её страницу.
   */
  const {
    name,
    url,
    image = undefined,
    to = undefined,
    links = undefined,
    linksLabel,
    showLabel,
    hideLabel,
  } = defineProps<{
    name: EntryName;
    /** Адрес записи: по нему подсвечивается открытая карточка. */
    url: string;
    image?: string | null;
    /** Адрес записи, например `/races/elf`. */
    to?: string;
    links?: Array<TypedLink> | null;
    /** Подсказка кнопки: «Разновидности», «Архетипы»… */
    linksLabel: string;
    showLabel: string;
    hideLabel: string;
  }>();

  const isExpanded = defineModel<boolean>('expanded', { default: false });

  defineSlots<{
    /** Значок перед названием. */
    icon?: () => unknown;
    /** Метки внизу карточки. */
    badges?: () => unknown;
  }>();

  const route = useRoute();
  const opener = useSectionOpener();

  /** Запись, открытая сейчас: поверх списка или своей страницей. */
  const openPath = computed(() =>
    opener ? opener.activePath.value : route.path,
  );

  const linkGroups = computed(() => groupByBookType(links));

  const toggleIcon = computed(() =>
    isExpanded.value ? LINK_CARD_ICON.collapse : LINK_CARD_ICON.expand,
  );

  const toggleLabel = computed(() =>
    isExpanded.value ? hideLabel : showLabel,
  );

  // Открыта сама запись или её разновидность — подсвечиваем карточку
  const isActive = computed(
    () => openPath.value === url || !!openPath.value?.startsWith(`${url}/`),
  );

  const cardClass = computed(() =>
    isActive.value ? 'border-primary ring-1 ring-primary/50' : 'border-default',
  );

  /**
   * Открывает запись через страницу раздела, если она умеет.
   * @param event - клик по ссылке
   * @param path - адрес записи или разновидности
   */
  function open(event: MouseEvent, path: string | undefined): void {
    if (!path || !opener) {
      return;
    }

    event.preventDefault();
    opener.open(path);
  }

  /**
   * Подсветка открытой разновидности полосой слева.
   * @param linkUrl - адрес разновидности
   */
  function getLinkClass(linkUrl: string) {
    return openPath.value === linkUrl
      ? 'border-link text-highlighted'
      : 'border-transparent';
  }

  function toggle() {
    isExpanded.value = !isExpanded.value;
  }
</script>

<template>
  <div
    :class="[$style.card, cardClass]"
    class="relative isolate overflow-hidden rounded-2xl border"
  >
    <img
      v-if="image"
      :src="image"
      :alt="name.rus"
      :class="$style.image"
      loading="lazy"
    />

    <div :class="$style.gradient" />

    <NuxtLink
      :to="to"
      class="relative z-10 flex h-32 flex-col justify-between p-4 sm:h-40"
      @click.left.exact.capture="open($event, to)"
    >
      <span class="flex items-start gap-2 pr-2">
        <slot name="icon" />

        <span class="flex flex-col">
          <span class="text-lg font-medium text-highlighted">
            {{ name.rus }}
          </span>

          <span class="text-sm text-muted">{{ name.eng }}</span>
        </span>
      </span>

      <span class="flex flex-wrap gap-1">
        <slot name="badges" />
      </span>
    </NuxtLink>

    <UTooltip
      v-if="linkGroups.length"
      :text="linksLabel"
    >
      <UButton
        :icon="toggleIcon"
        :aria-label="toggleLabel"
        :aria-expanded="isExpanded"
        class="absolute right-0 bottom-0 z-20 rounded-none rounded-tl-xl"
        @click.left.exact.prevent="toggle"
      />
    </UTooltip>

    <div
      v-if="isExpanded && linkGroups.length"
      class="relative z-10 flex flex-col gap-4 px-4 pb-4"
    >
      <div
        v-for="group in linkGroups"
        :key="group.name"
      >
        <p class="px-2 text-highlighted">
          {{ group.name }}
        </p>

        <ul class="ml-2 flex flex-col items-start border-l border-default pt-2">
          <li
            v-for="link in group.items"
            :key="link.url"
          >
            <NuxtLink
              :to="link.url"
              :class="getLinkClass(link.url)"
              class="-ml-px block border-l-2 px-2 py-1.5 hover:bg-elevated"
              @click.left.exact.capture="open($event, link.url)"
            >
              {{ link.name.rus }}

              <span class="text-xs text-muted">
                {{ link.source?.shortName }} / {{ link.name.eng }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  /* Фон и градиент карточки — переменные темы старого SPA */
  .card {
    background-color: var(--bg-table-list);
  }

  .image {
    pointer-events: none;

    position: absolute;
    top: 0;
    right: 0;

    width: 50%;

    @media (width >= 64rem) {
      width: 70%;
    }

    @media (width >= 96rem) {
      width: 80%;
    }
  }

  .gradient {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: var(--bg-liner-list);
  }
</style>
