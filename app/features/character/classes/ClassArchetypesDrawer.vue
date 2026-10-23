<script setup lang="ts">
  import type { TypedLink } from '../model';

  import { SectionDrawer } from '~section/entry-drawer';
  import { SectionSourceBadge } from '~section/source-badge';

  import { groupByBookType } from '../model';

  /**
   * Архетипы класса в дровере справа, как подклассы на new.ttg.club:
   * сгруппированы по типу книги, клик ведёт на страницу архетипа.
   */
  const { title, className, classUrl, archetypes } = defineProps<{
    /** Как называются архетипы класса: «Подклассы», «Божественные домены»… */
    title: string;
    className: string;
    classUrl: string;
    archetypes: Array<TypedLink>;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const route = useRoute();

  const groups = computed(() => groupByBookType(archetypes));

  /**
   * Подсветка открытого сейчас архетипа.
   * @param url - адрес архетипа
   */
  function getLinkClass(url: string) {
    return route.path === url
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-muted hover:border-accented';
  }

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <SectionDrawer
    v-model:open="isOpen"
    :title="title"
    :subtitle="className"
    :path="classUrl"
  >
    <div class="flex flex-col gap-4">
      <section
        v-for="group in groups"
        :key="group.name"
        class="flex flex-col gap-2"
      >
        <h3 class="text-sm font-semibold text-muted">
          {{ group.name }}
        </h3>

        <NuxtLink
          v-for="link in group.items"
          :key="link.url"
          :to="link.url"
          :class="getLinkClass(link.url)"
          class="flex items-center justify-between gap-2 rounded-xl border px-4 py-3 transition-colors"
          @click.left.exact="close"
        >
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate font-semibold text-highlighted">
              {{ link.name.rus }}
            </span>

            <span class="truncate text-sm">{{ link.name.eng }}</span>
          </span>

          <SectionSourceBadge
            v-if="link.source?.group"
            :group="link.source.group"
            :label="link.source.shortName"
            :tooltip="link.source.name"
          />
        </NuxtLink>
      </section>
    </div>
  </SectionDrawer>
</template>
