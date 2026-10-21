<script setup lang="ts">
  import {
    EXTERNAL_LINK_REL,
    EXTERNAL_LINK_TARGET,
    EXTERNAL_URL,
    isKnownRoute,
  } from '../model';

  /**
   * Ссылка из контента. Внутренние адреса ведут через роутер, а страницы,
   * которых ещё нет в Nuxt, открываются обычным переходом: их пока отдаёт
   * старое SPA.
   */
  const { href, attributes } = defineProps<{
    href: string;
    attributes: Record<string, string>;
  }>();

  const router = useRouter();

  const isInternal = computed(() => href.startsWith('/'));

  const isNuxtPage = computed(
    () =>
      isInternal.value
      && isKnownRoute(
        href,
        router.getRoutes().map((route) => route.path),
      ),
  );

  const isHttp = computed(() => EXTERNAL_URL.test(href));
</script>

<template>
  <NuxtLink
    v-if="isInternal"
    v-bind="attributes"
    :to="href"
    :external="!isNuxtPage"
  >
    <slot />
  </NuxtLink>

  <a
    v-else-if="isHttp"
    v-bind="attributes"
    :href="href"
    :target="EXTERNAL_LINK_TARGET"
    :rel="EXTERNAL_LINK_REL"
  >
    <slot />
  </a>

  <a
    v-else
    v-bind="attributes"
    :href="href"
  >
    <slot />
  </a>
</template>
