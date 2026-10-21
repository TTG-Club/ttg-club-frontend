<script setup lang="ts">
  import type { GodDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionImagePreview } from '~section/image-preview';
  import { SectionSourceBar } from '~section/source-bar';

  import { GOD_TEXT, joinWikiList } from '../model';

  /**
   * Карточка бога: картинка, мировоззрение, символ, домены и пантеон, а
   * под катом — сведения из других источников.
   */
  const { god } = defineProps<{
    god: GodDetail;
  }>();

  const domains = computed(() => joinWikiList(god.domains));
  const pantheons = computed(() => joinWikiList(god.panteons));
  const titles = computed(() => joinWikiList(god.titles));
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :source="god.source" />

    <div class="flow-root">
      <SectionImagePreview
        v-if="god.images?.length"
        :images="god.images"
        :alt="god.name.rus"
      />

      <ul class="flex flex-col gap-1.5">
        <li>
          <b>{{ GOD_TEXT.alignment }}</b> {{ god.alignment }}
        </li>

        <li v-if="god.symbol">
          <b>{{ GOD_TEXT.symbol }}</b> {{ god.symbol }}
        </li>

        <li v-if="domains">
          <b>{{ GOD_TEXT.domains }}</b> {{ domains }}
        </li>

        <li v-if="pantheons">
          <b>{{ GOD_TEXT.pantheons }}</b> {{ pantheons }}
        </li>
      </ul>
    </div>

    <div class="content-render">
      <details>
        <summary class="h4">
          <span>{{ GOD_TEXT.otherSources }}</span>
        </summary>

        <div class="content">
          <p v-if="god.rank">
            <b>{{ GOD_TEXT.rank }}</b> {{ god.rank }}
          </p>

          <p v-if="titles">
            <b>{{ GOD_TEXT.titles }}</b> {{ titles }}
          </p>

          <ContentRender
            v-if="god.description"
            :html="god.description"
          />
        </div>
      </details>
    </div>
  </div>
</template>
