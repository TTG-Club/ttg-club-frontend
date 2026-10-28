<script setup lang="ts">
  import type { EntryName, EntrySource } from '~section/model';

  import type { TypedLink } from '../model';

  import { useSectionOpener } from '~section/composables';
  import { SectionSourceBadge } from '~section/source-badge';

  import {
    groupByBookType,
    LINK_CARD_CAPTION_SEPARATOR,
    LINK_CARD_ICON,
  } from '../model';

  /**
   * Карточка расы или класса в виде «Модерн», как в старом SPA: строка с
   * обложкой на фоне справа, значком, подписями и книгой. Кнопка в углу
   * раскрывает разновидности или архетипы прямо в карточке. Клик открывает
   * запись так, как велит режим раздела: дровером или панелью рядом.
   */
  const {
    name,
    url,
    source = undefined,
    image = undefined,
    icon = undefined,
    tags = [],
    to = undefined,
    links = undefined,
    linksLabel,
  } = defineProps<{
    name: EntryName;
    /** Адрес записи: по нему подсвечивается открытая карточка. */
    url: string;
    source?: EntrySource | null;
    image?: string | null;
    /** Значок слева от названия, например класса. */
    icon?: string;
    /** Подписи под названием: кость хитов класса, бонусы расы. */
    tags?: Array<string>;
    /** Адрес записи, например `/races/elf`. */
    to?: string;
    /** Разновидности расы или архетипы класса. */
    links?: Array<TypedLink> | null;
    /** Как называются ссылки: «Разновидности», «Божественные домены»… */
    linksLabel: string;
  }>();

  const route = useRoute();
  const opener = useSectionOpener();

  /** Запись, открытая сейчас: поверх списка или своей страницей. */
  const openPath = computed(() =>
    opener ? opener.activePath.value : route.path,
  );

  const hasLinks = computed(() => !!links?.length);

  const linkGroups = computed(() => groupByBookType(links));

  // Открыта сама запись или её разновидность — подсвечиваем карточку
  const isActive = computed(
    () => openPath.value === url || !!openPath.value?.startsWith(`${url}/`),
  );

  const isLinksOpen = ref(false);

  const cardClass = computed(() =>
    isActive.value
      ? 'border-primary ring-1 ring-primary/50'
      : 'border-default hover:border-accented',
  );

  const toggleIcon = computed(() =>
    isLinksOpen.value ? LINK_CARD_ICON.collapse : LINK_CARD_ICON.expand,
  );

  // Как в старом SPA: у открытой записи варианты сразу раскрыты
  watchImmediate(isActive, (active) => {
    if (active) {
      isLinksOpen.value = true;
    }
  });

  /**
   * Подсветка открытой сейчас разновидности или архетипа.
   * @param linkUrl - адрес записи
   */
  function getLinkClass(linkUrl: string) {
    return openPath.value === linkUrl
      ? 'bg-primary/10 text-highlighted'
      : 'hover:bg-elevated';
  }

  /**
   * Подпись варианта под названием: книга и английское название.
   * @param link - разновидность или архетип
   */
  function getLinkCaption(link: TypedLink): string {
    return [link.source?.shortName, link.name.eng]
      .filter(Boolean)
      .join(LINK_CARD_CAPTION_SEPARATOR);
  }

  /**
   * Открывает запись через страницу раздела, если она умеет.
   * @param event - клик по ссылке
   * @param path - адрес записи
   */
  function openEntry(event: MouseEvent, path?: string): void {
    if (!path || !opener) {
      return;
    }

    event.preventDefault();
    opener.open(path);
  }

  function toggleLinks(): void {
    isLinksOpen.value = !isLinksOpen.value;
  }
</script>

<template>
  <!-- Рамку фокуса ссылки заменяет кольцо всей карточки и только с клавиатуры -->
  <div
    :class="cardClass"
    class="group relative isolate overflow-hidden rounded-2xl border bg-muted transition-colors has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary"
  >
    <!-- Обложка справа на фоне: портрет в полный рост, видно голову и торс -->
    <img
      v-if="image"
      :src="image"
      alt=""
      class="pointer-events-none absolute top-0 right-0 -z-10 w-1/2 opacity-90 transition-transform duration-500 group-hover:scale-105 @lg:w-3/5"
      loading="lazy"
    />

    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-muted from-30% via-muted/70 to-transparent"
    />

    <div class="flex min-h-28 items-start gap-3 p-4">
      <span
        v-if="icon"
        class="flex size-11 flex-none items-center justify-center rounded-lg bg-elevated/80 text-primary"
      >
        <UIcon
          :name="icon"
          class="size-8"
        />
      </span>

      <div class="flex min-w-0 flex-auto flex-col gap-4">
        <NuxtLink
          :to="to"
          class="flex min-w-0 flex-col gap-0.5 pr-8 outline-none after:absolute after:inset-0"
          @click.left.exact.capture="openEntry($event, to)"
        >
          <span
            :title="name.rus"
            class="truncate text-lg font-semibold text-highlighted"
          >
            {{ name.rus }}
          </span>

          <span
            :title="name.eng"
            class="truncate text-sm text-muted"
          >
            {{ name.eng }}
          </span>
        </NuxtLink>

        <div class="relative z-10 flex flex-wrap items-center gap-1.5">
          <UBadge
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            color="primary"
            class="rounded-full"
          />

          <SectionSourceBadge
            v-if="source?.group"
            :group="source.group"
            :label="source.shortName"
            :tooltip="source.name"
          />
        </div>
      </div>
    </div>

    <UTooltip
      v-if="hasLinks"
      :text="linksLabel"
    >
      <UButton
        :icon="toggleIcon"
        :aria-label="linksLabel"
        :aria-expanded="isLinksOpen"
        class="absolute right-0 bottom-0 z-10 rounded-none rounded-tl-xl"
        @click.left.exact.prevent="toggleLinks"
      />
    </UTooltip>

    <div
      v-if="hasLinks && isLinksOpen"
      class="relative z-10 flex flex-col gap-3 px-4 pb-10"
    >
      <section
        v-for="group in linkGroups"
        :key="group.name"
        class="flex flex-col gap-1"
      >
        <h3 class="text-sm font-semibold text-muted">
          {{ group.name }}
        </h3>

        <div class="ml-2 flex flex-col border-l border-default pl-2">
          <NuxtLink
            v-for="link in group.items"
            :key="link.url"
            :to="link.url"
            :class="getLinkClass(link.url)"
            class="flex flex-col rounded-md px-2 py-1 transition-colors"
            @click.left.exact.capture="openEntry($event, link.url)"
          >
            <span class="font-medium">{{ link.name.rus }}</span>

            <span class="text-xs text-muted">
              {{ getLinkCaption(link) }}
            </span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
