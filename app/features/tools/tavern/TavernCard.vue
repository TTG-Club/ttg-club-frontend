<script setup lang="ts">
  import type { Tavern, TavernField } from '../model';

  import { ContentRender } from '~content/render';

  import { ToolCloseButton } from '../generator';
  import { getTavernTags, TAVERN_SECTIONS, TAVERN_TEXT } from '../model';
  import TavernReroll from './TavernReroll.vue';

  /**
   * Карточка таверны: название с метками и части из бэкенда, каждую можно
   * перегенерировать отдельно, а всю карточку убрать из списка.
   */
  const { tavern, pending = [] } = defineProps<{
    tavern: Tavern;
    /** Части, которые сейчас обновляются. */
    pending?: ReadonlyArray<TavernField>;
  }>();

  const emit = defineEmits<{
    reroll: [field: TavernField];
    close: [];
  }>();

  const tags = computed(() => getTavernTags(tavern));

  /**
   * Просит обновить часть таверны.
   * @param field - часть таверны
   */
  function reroll(field: TavernField): void {
    emit('reroll', field);
  }

  function close(): void {
    emit('close');
  }
</script>

<template>
  <article
    class="flex flex-col gap-4 rounded-xl border border-default bg-elevated/50 p-4"
  >
    <header class="flex items-start gap-3">
      <div class="flex min-w-0 flex-auto flex-col gap-2">
        <h2 class="text-xl font-semibold text-highlighted">
          {{ tavern.name }}
        </h2>

        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            color="neutral"
            variant="subtle"
          />
        </div>
      </div>

      <TavernReroll
        :label="TAVERN_TEXT.rerollName"
        :is-pending="pending.includes('name')"
        @reroll="reroll('name')"
      />

      <ToolCloseButton @close="close" />
    </header>

    <section
      v-for="field in TAVERN_SECTIONS"
      :key="field"
      class="flex items-start gap-3 border-t border-default pt-4"
    >
      <ContentRender
        :html="tavern[field]"
        class="min-w-0 flex-auto"
      />

      <TavernReroll
        :label="TAVERN_TEXT.reroll"
        :is-pending="pending.includes(field)"
        @reroll="reroll(field)"
      />
    </section>
  </article>
</template>
