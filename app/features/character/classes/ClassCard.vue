<script setup lang="ts">
  import type { ClassLink } from '../model';

  import { useSectionOpener } from '~section/composables';
  import { SectionSourceBadge } from '~section/source-badge';

  import { CLASS_ICON, CLASS_TEXT, getClassIcon } from '../model';
  import ClassArchetypesDrawer from './ClassArchetypesDrawer.vue';

  /**
   * Карточка класса в списке, как на new.ttg.club: квадратная обложка с
   * книгой в углу, названия под ней, а на узком экране — строкой с
   * миниатюрой. Кнопка открывает архетипы в дровере справа. Клик открывает
   * класс так, как велит режим раздела: дровером или панелью рядом.
   */
  const { classLink, to = undefined } = defineProps<{
    classLink: ClassLink;
    to?: string;
  }>();

  const route = useRoute();
  const opener = useSectionOpener();

  /** Запись, открытая сейчас: поверх списка или своей страницей. */
  const openPath = computed(() =>
    opener ? opener.activePath.value : route.path,
  );

  const icon = computed(() => getClassIcon(classLink.icon));

  const archetypesLabel = computed(
    () => classLink.archetypeName ?? CLASS_TEXT.archetypes,
  );

  const hasArchetypes = computed(() => !!classLink.archetypes?.length);

  const isArchetypesOpen = ref(false);

  // Открыт сам класс или его архетип — подсвечиваем карточку
  const isActive = computed(
    () =>
      openPath.value === classLink.url
      || !!openPath.value?.startsWith(`${classLink.url}/`),
  );

  const cardClass = computed(() =>
    isActive.value
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-muted hover:border-accented',
  );

  /**
   * Открывает класс через страницу раздела, если она умеет.
   * @param event - клик по ссылке
   */
  function openClass(event: MouseEvent): void {
    if (!to || !opener) {
      return;
    }

    event.preventDefault();
    opener.open(to);
  }

  function openArchetypes(): void {
    isArchetypesOpen.value = true;
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
      <img
        v-if="classLink.image"
        :src="classLink.image"
        :alt="classLink.name.rus"
        class="absolute size-full object-cover opacity-90"
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
        v-if="classLink.source.group"
        class="absolute top-2 right-2 z-10 flex @max-md:hidden"
      >
        <SectionSourceBadge
          :group="classLink.source.group"
          :label="classLink.source.shortName"
          :tooltip="classLink.source.name"
        />
      </span>
    </div>

    <div
      class="flex min-w-0 flex-auto items-center justify-between gap-2 px-4 py-3 @max-md:px-3 @max-md:py-2"
    >
      <NuxtLink
        :to="to"
        class="flex min-w-0 flex-auto flex-col justify-center gap-0.5 after:absolute after:inset-0"
        @click.left.exact.capture="openClass"
      >
        <span
          :title="classLink.name.rus"
          class="truncate font-semibold text-highlighted"
        >
          {{ classLink.name.rus }}
        </span>

        <span
          :title="classLink.name.eng"
          class="truncate"
        >
          {{ classLink.name.eng }}
        </span>
      </NuxtLink>

      <span
        v-if="classLink.source.group"
        class="relative z-10 flex @md:hidden"
      >
        <SectionSourceBadge
          :group="classLink.source.group"
          :label="classLink.source.shortName"
          :tooltip="classLink.source.name"
        />
      </span>

      <UTooltip
        v-if="hasArchetypes"
        :text="archetypesLabel"
      >
        <UButton
          :icon="CLASS_ICON.archetypes"
          :aria-label="archetypesLabel"
          color="neutral"
          variant="soft"
          class="relative z-10 flex-none"
          @click.left.exact.prevent="openArchetypes"
        />
      </UTooltip>
    </div>

    <ClassArchetypesDrawer
      v-if="hasArchetypes"
      v-model:open="isArchetypesOpen"
      :title="archetypesLabel"
      :class-name="classLink.name.rus"
      :class-url="classLink.url"
      :archetypes="classLink.archetypes ?? []"
    />
  </div>
</template>
