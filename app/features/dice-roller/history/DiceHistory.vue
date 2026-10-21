<script setup lang="ts">
  import { useDiceHistory } from '../composables';
  import { ROLL_HISTORY_ICON, ROLL_HISTORY_TEXT } from '../model';
  import DiceHistoryInput from './DiceHistoryInput.vue';
  import DiceHistoryItem from './DiceHistoryItem.vue';
  import DiceHistoryToggle from './DiceHistoryToggle.vue';

  /**
   * Окно истории бросков в правом нижнем углу. Пока оно открыто, броски
   * попадают сюда, а не в уведомления. На десктопе окно открывается
   * плавающей кнопкой, на телефоне — кнопкой в нижней панели.
   */
  const { entries, isOpen, clear } = useDiceHistory();

  const list = useTemplateRef('list');

  function scrollDown() {
    list.value?.scrollTo({ top: list.value.scrollHeight });
  }

  watch(() => entries.value.length, scrollDown, { flush: 'post' });
  watch(isOpen, scrollDown, { flush: 'post' });
</script>

<template>
  <section
    v-if="isOpen"
    :aria-label="ROLL_HISTORY_TEXT.title"
    class="fixed inset-x-2 bottom-[calc(var(--navbar-height)+0.5rem)] z-90 flex h-[60dvh] flex-col rounded-lg border border-default bg-elevated shadow-lg md:inset-x-auto md:right-4 md:bottom-20 md:h-[min(60dvh,32rem)] md:w-96"
  >
    <header
      class="flex items-center justify-between border-b border-default py-1 pr-1 pl-3"
    >
      {{ ROLL_HISTORY_TEXT.title }}

      <UTooltip :text="ROLL_HISTORY_TEXT.clear">
        <UButton
          :icon="ROLL_HISTORY_ICON.clear"
          :aria-label="ROLL_HISTORY_TEXT.clear"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="clear"
        />
      </UTooltip>
    </header>

    <div
      ref="list"
      class="flex flex-auto flex-col overflow-y-auto px-2"
    >
      <p
        v-if="!entries.length"
        class="m-auto text-sm text-muted"
      >
        {{ ROLL_HISTORY_TEXT.empty }}
      </p>

      <div
        v-else
        class="mt-auto"
      >
        <DiceHistoryItem
          v-for="entry in entries"
          :key="entry.id"
          :entry="entry"
        />
      </div>
    </div>

    <div class="p-2">
      <DiceHistoryInput />
    </div>
  </section>

  <div
    class="fixed right-4 bottom-6 z-90 hidden rounded-full border border-default bg-default shadow-lg md:block"
  >
    <DiceHistoryToggle />
  </div>
</template>
