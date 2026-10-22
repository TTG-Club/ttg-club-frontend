<script setup lang="ts">
  import type { ScreenDetail } from '../model';

  import { ContentLink, ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';

  import { SCREEN_TEXT } from '../model';

  /** Вложенный раздел ширмы: ссылка на родителя, источник и описание. */
  const { screen } = defineProps<{
    screen: ScreenDetail;
  }>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :source="screen.source">
      <template
        v-if="screen.parent"
        #left
      >
        <span class="mr-1">{{ SCREEN_TEXT.parent }}</span>

        <ContentLink
          class="text-link not-italic hover:text-link-hover"
          :href="screen.parent.url"
          :attributes="{}"
          >{{ screen.parent.name.rus }}</ContentLink
        >
      </template>
    </SectionSourceBar>

    <ContentRender
      v-if="screen.description"
      :html="screen.description"
    />
  </div>
</template>
