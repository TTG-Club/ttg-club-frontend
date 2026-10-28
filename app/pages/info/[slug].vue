<script setup lang="ts">
  import { ContentRender } from '~content/render';
  import { HomeSocialLinks } from '~home/social-links';
  import { useInfoPage } from '~info/composables';
  import { getInfoSlug, INFO_TEXT } from '~info/model';

  const route = useRoute();

  const { page, isError } = await useInfoPage(() =>
    getInfoSlug(route.params.slug),
  );

  const title = computed(() => page.value?.title || INFO_TEXT.title);
</script>

<template>
  <article class="mx-auto flex w-full max-w-4xl flex-col gap-6">
    <header class="flex flex-col gap-2 border-b border-default pb-4">
      <h1 class="font-serif text-3xl text-title">
        {{ title }}
      </h1>

      <p
        v-if="page?.subtitle"
        class="text-lg text-muted"
      >
        {{ page.subtitle }}
      </p>
    </header>

    <ContentRender
      v-if="page?.description"
      :html="page.description"
    />

    <p v-else-if="isError">
      {{ INFO_TEXT.error }}
    </p>

    <div class="max-w-md">
      <HomeSocialLinks />
    </div>
  </article>
</template>
