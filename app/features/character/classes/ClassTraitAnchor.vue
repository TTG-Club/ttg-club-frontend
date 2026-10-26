<script setup lang="ts">
  import type { ClassFeature, ClassTraitLink } from '../model';

  import { ContentRender } from '~content/render';

  import { CLASS_TRAIT_HINT_OPEN_DELAY_MS } from '../model';

  /**
   * Умение в таблице уровней: клик ведёт к его описанию ниже, а при
   * наведении описание видно сразу.
   */
  const { traitLink, feature = undefined } = defineProps<{
    traitLink: ClassTraitLink;
    /** Умение, на которое ведёт ссылка; без него подсказки нет. */
    feature?: ClassFeature;
  }>();

  const emit = defineEmits<{
    select: [anchor: string];
  }>();

  const linkClass = computed(() =>
    traitLink.archetypeFeature ? 'archetype_feet' : undefined,
  );

  function select() {
    emit('select', traitLink.anchor);
  }
</script>

<template>
  <UPopover
    v-if="feature?.description"
    mode="hover"
    :open-delay="CLASS_TRAIT_HINT_OPEN_DELAY_MS"
  >
    <a
      :href="traitLink.anchor"
      :class="linkClass"
      @click.left.exact.prevent="select"
      >{{ traitLink.name }}</a
    >

    <template #content>
      <div class="max-h-96 max-w-md overflow-auto p-3">
        <ContentRender :html="feature.description" />
      </div>
    </template>
  </UPopover>

  <a
    v-else
    :href="traitLink.anchor"
    :class="linkClass"
    @click.left.exact.prevent="select"
    >{{ traitLink.name }}</a
  >
</template>
