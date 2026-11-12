<script setup lang="ts">
  /**
   * Подсказка для мест, которых на странице сотни (плитки списков): пока на
   * элемент не навели и не перевели фокус, это простая обёртка без подсказки,
   * а сама подсказка создаётся при первом наведении. Обёртка не участвует в
   * раскладке, поэтому вёрстка та же, что с обычной подсказкой.
   */
  const { text = undefined, disabled = false } = defineProps<{
    /** Текст подсказки */
    text?: string;
    /** Подсказка выключена */
    disabled?: boolean;
  }>();

  defineSlots<{
    /** Элемент, к которому относится подсказка */
    default: () => unknown;
  }>();

  const isMounted = ref(false);

  function mount(): void {
    isMounted.value = true;
  }
</script>

<template>
  <UTooltip
    v-if="isMounted"
    :text="text"
    :disabled="disabled"
  >
    <slot />
  </UTooltip>

  <span
    v-else
    class="contents"
    @pointerover.once="mount"
    @focusin.once="mount"
  >
    <slot />
  </span>
</template>
