<script setup lang="ts">
  import HomeEyebrow from './HomeEyebrow.vue';

  const props = withDefaults(
    defineProps<{
      /** Моно-подпись в шапке панели; без неё шапка не рисуется */
      label?: string;
      /** Иконка рядом с подписью */
      icon?: string;
      /** Содержимое без внутренних отступов — для картинки во всю ширину */
      flush?: boolean;
      /** Тело тянется на высоту панели и раскладывает содержимое столбцом */
      fill?: boolean;
    }>(),
    {
      label: undefined,
      icon: undefined,
      flush: false,
      fill: false,
    },
  );

  const bodyClasses = computed(() => [
    'home-panel__body',
    {
      'home-panel__body_flush': props.flush,
      'home-panel__body_fill': props.fill,
    },
  ]);
</script>

<template>
  <section class="home-panel">
    <header
      v-if="label"
      class="home-panel__header"
    >
      <home-eyebrow
        :label="label"
        :icon="icon"
      />
    </header>

    <div :class="bodyClasses">
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
  .home-panel {
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;

    min-width: 0;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;

    transition: border-color 0.2s ease;

    &:hover {
      border-color: var(--secondary-hover);
    }

    &__header {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
      align-items: center;
      justify-content: space-between;

      padding: 10px 12px;

      border-bottom: 1px solid var(--border);
    }

    &__body {
      padding: 12px;

      &_flush {
        padding: 0;
      }

      // min-height: 0 — чтобы содержимое могло прокручиваться внутри, когда
      // высоту панели задаёт раскладка, а не содержимое
      &_fill {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;
      }
    }
  }
</style>
