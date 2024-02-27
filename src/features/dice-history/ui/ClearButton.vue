<template>
  <!-- TODO: Use UIKit button for this -->
  <button
    v-tippy="'Очистить историю'"
    class="clear-button"
    type="button"
    v-bind="$attrs"
  >
    <svg-icon
      size="20"
      icon="clear"
    />
  </button>
</template>

<style lang="scss" scoped>
  .clear-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    aspect-ratio: 1;
    padding: 0;
    overflow: hidden;
    color: var(--text-b-color);
    border-radius: 8px;

    &:hover {
      &::before {
        opacity: 0.15;
      }
    }

    &::before {
      position: absolute;
      inset: 0;
      content: '';
      background-color: black;
      opacity: 0;
      @include css_anim;
    }
  }
</style>
