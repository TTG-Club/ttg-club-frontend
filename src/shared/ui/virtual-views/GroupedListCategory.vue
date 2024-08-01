<template>
  <div class="category">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .category {
    padding: 8px 16px;

    font-size: calc(var(--h5-font-size) + 2px);
    font-weight: 600;
    color: var(--text-color-title);

    background: var(--border);
    border-radius: 8px;
  }
</style>
