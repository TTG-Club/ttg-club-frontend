<script setup lang="ts">
  /**
   * Подсказка для мест, которых на странице сотни (плитки списков): пока на
   * элемент не навели, это простая обёртка без подсказки, а сама подсказка
   * создаётся при первом наведении. Обёртка не участвует в раскладке, поэтому
   * вёрстка та же, что с обычной подсказкой.
   *
   * Только для содержимого без фокуса и своего состояния (текст, метка): при
   * первом наведении оно создаётся заново. Кнопкам и ссылкам — обычный
   * `UTooltip`.
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

  /** Создаёт настоящую подсказку вместо обёртки. */
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
  >
    <slot />
  </span>
</template>
