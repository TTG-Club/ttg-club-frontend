<script setup lang="ts">
  import type { MenuGroup } from '../model';

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
    })),
  );
</script>

<template>
  <section class="break-inside-avoid pb-6">
    <h3
      class="mb-1 flex items-center justify-between gap-2 px-2.5 text-sm font-semibold text-title"
    >
      {{ group.label }}

      <UIcon
        v-if="group.icon"
        :name="group.icon"
        class="size-5 text-dimmed"
      />
    </h3>

    <ul class="flex flex-col gap-0.5">
      <li
        v-for="link in links"
        :key="link.key"
      >
        <span
          v-if="!link.url"
          class="block px-2.5 py-1.5 text-dimmed"
        >
          {{ link.label }}
        </span>

        <UButton
          v-else
          :to="link.url"
          :external="link.isFullReload"
          :target="link.target"
          color="neutral"
          variant="ghost"
          active-variant="soft"
          active-color="primary"
          block
          :ui="{
            base: 'justify-start px-2.5 py-1.5 text-left font-normal',
            label: 'whitespace-normal',
          }"
          :label="link.label"
        />
      </li>
    </ul>
  </section>
</template>
