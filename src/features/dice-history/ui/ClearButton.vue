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
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 0;
    width: 20px;
    aspect-ratio: 1;
    color: var(--text-b-color);
    border-radius: 8px;
    overflow: hidden;

    &:hover {
      &::before {
        opacity: 15%;
      }
    }

    &::before {
      position: absolute;
      inset: 0;
      content: '';
      opacity: 0;
      background-color: black;
      @include css_anim;
    }
  }
</style>
