<script setup lang="ts">
  import type { EntryName, EntrySource } from '~section/model';

  import type { TypedLink } from '../model';

  import { useSectionOpener } from '~section/composables';
  import { SectionSourceBadge } from '~section/source-badge';

  import { LINK_CARD_ICON } from '../model';
  import CharacterLinksDrawer from './CharacterLinksDrawer.vue';

  /**
   * Карточка расы или класса в списке, как на new.ttg.club: квадратная
   * обложка с книгой в углу, названия под ней, а на узком экране — строкой
   * с миниатюрой. Кнопка открывает разновидности или архетипы в дровере
   * справа. Клик открывает запись так, как велит режим раздела: дровером
   * или панелью рядом.
   */
  const {
    name,
    url,
    source = undefined,
    image = undefined,
    icon = undefined,
    to = undefined,
    links = undefined,
    linksLabel,
  } = defineProps<{
    name: EntryName;
    /** Адрес записи: по нему подсвечивается открытая карточка. */
    url: string;
    source?: EntrySource | null;
    image?: string | null;
    /** Значок вместо обложки, когда картинки нет. */
    icon?: string;
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

  const isLinksOpen = ref(false);

  // Открыта сама запись или её разновидность — подсвечиваем карточку
  const isActive = computed(
    () => openPath.value === url || !!openPath.value?.startsWith(`${url}/`),
  );

  const cardClass = computed(() =>
    isActive.value
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-muted hover:border-accented',
  );

  /**
   * Открывает запись через страницу раздела, если она умеет.
   * @param event - клик по ссылке
   */
  function openEntry(event: MouseEvent): void {
    if (!to || !opener) {
      return;
    }

    event.preventDefault();
    opener.open(to);
  }

  function openLinks(): void {
    isLinksOpen.value = true;
  }
</script>

<template>
  <div
    :class="cardClass"
    class="group relative flex flex-col overflow-hidden rounded-xl border transition-colors @max-md:flex-row"
  >
    <div
      class="relative flex aspect-square w-full flex-none items-center justify-center overflow-hidden bg-elevated @max-md:size-25"
    >
      <!-- Обложки — портреты в полный рост: показываем голову и торс -->
      <img
        v-if="image"
        :src="image"
        :alt="name.rus"
        class="absolute size-full object-cover object-top opacity-90"
        loading="lazy"
      />

      <UIcon
        v-else-if="icon"
        :name="icon"
        class="size-1/2 text-dimmed"
      />

      <!-- Градиент уезжает при наведении и открывает обложку целиком -->
      <div
        class="absolute inset-0 bg-linear-to-t from-muted to-transparent to-50% transition-all duration-300 @max-md:bg-linear-to-l @md:group-hover:top-full"
      />

      <span
        v-if="source?.group"
        class="absolute top-2 right-2 z-10 flex @max-md:hidden"
      >
        <SectionSourceBadge
          :group="source.group"
          :label="source.shortName"
          :tooltip="source.name"
        />
      </span>
    </div>

    <div
      class="flex min-w-0 flex-auto items-center justify-between gap-2 px-4 py-3 @max-md:px-3 @max-md:py-2"
    >
      <NuxtLink
        :to="to"
        class="flex min-w-0 flex-auto flex-col justify-center gap-0.5 after:absolute after:inset-0"
        @click.left.exact.capture="openEntry"
      >
        <span
          :title="name.rus"
          class="truncate font-semibold text-highlighted"
        >
          {{ name.rus }}
        </span>

        <span
          :title="name.eng"
          class="truncate"
        >
          {{ name.eng }}
        </span>
      </NuxtLink>

      <span
        v-if="source?.group"
        class="relative z-10 flex @md:hidden"
      >
        <SectionSourceBadge
          :group="source.group"
          :label="source.shortName"
          :tooltip="source.name"
        />
      </span>

      <UTooltip
        v-if="hasLinks"
        :text="linksLabel"
      >
        <UButton
          :icon="LINK_CARD_ICON.links"
          :aria-label="linksLabel"
          color="neutral"
          variant="soft"
          class="relative z-10 flex-none"
          @click.left.exact.prevent="openLinks"
        />
      </UTooltip>
    </div>

    <CharacterLinksDrawer
      v-if="hasLinks"
      v-model:open="isLinksOpen"
      :title="linksLabel"
      :parent-name="name.rus"
      :parent-url="url"
      :links="links ?? []"
    />
  </div>
</template>
