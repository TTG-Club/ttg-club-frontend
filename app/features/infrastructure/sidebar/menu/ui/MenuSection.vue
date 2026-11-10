<script setup lang="ts">
  import type { MenuGroup } from '../model';

  import { MENU_EXTERNAL_ICON } from '../model';

  const { group } = defineProps<{
    group: MenuGroup;
  }>();

  const router = useRouter();

  /**
   * Перенесённые разделы открываются без перезагрузки, остальные уходят на
   * сервер: шлюз отдаёт их старому SPA.
   */
  const links = computed(() =>
    group.links.map((link) => ({
      ...link,
      key: `${link.label}:${link.url ?? ''}`,
      isFullReload:
        link.external
        || !link.url
        || router.resolve(link.url).matched.length === 0,
      target: link.external ? '_blank' : undefined,
      trailingIcon: link.external ? MENU_EXTERNAL_ICON : undefined,
    })),
  );
</script>

<template>
  <section :class="$style.section">
    <h3
      class="mb-1 px-2.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase"
    >
      {{ group.label }}
    </h3>

    <ul class="flex flex-col gap-0.5">
      <li
        v-for="link in links"
        :key="link.key"
      >
        <span
          v-if="!link.url"
          class="flex items-center gap-2.5 px-2.5 py-2 text-dimmed"
        >
          <UIcon
            :name="link.icon"
            class="size-4.5 shrink-0"
          />

          {{ link.label }}
        </span>

        <UButton
          v-else
          :to="link.url"
          :external="link.isFullReload"
          :target="link.target"
          :icon="link.icon"
          :trailing-icon="link.trailingIcon"
          color="neutral"
          variant="ghost"
          active-variant="soft"
          active-color="primary"
          block
          :ui="{
            base: 'justify-start gap-2.5 px-2.5 py-2 text-left font-normal',
            leadingIcon: 'size-4.5 text-dimmed',
            trailingIcon: 'size-3.5 text-dimmed',
            label: 'whitespace-normal',
          }"
          :class="$style.item"
          :active-class="$style.active"
          :label="link.label"
        />
      </li>
    </ul>
  </section>
</template>

<style lang="scss" module>
  // Раздел не рвётся между колонками меню (см. .content в AppMenu)
  .section {
    break-inside: avoid;
    padding-bottom: 32px;
  }

  // Иконка пункта подхватывает цвет текста при наведении и на текущем разделе
  .item {
    &:hover,
    &.active {
      :global(.iconify) {
        color: currentcolor;
      }
    }
  }
</style>
