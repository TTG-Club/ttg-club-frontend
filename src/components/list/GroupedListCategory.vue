<template>
  <div class="category">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .category {
    background: var(--bg-liner-divider);
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--text-btn-color);
    font-size: var(--h4-font-size);
  }
</style>
