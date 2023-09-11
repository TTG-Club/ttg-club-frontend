<template>
  <div class="category">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .category {
    padding: 8px 16px;
    color: var(--text-color-title);
    font-size: calc(var(--h5-font-size) + 2px);
    font-weight: 600;
    background: var(--border);
    border-radius: 8px;
  }
</style>
