<script setup lang="ts">
  defineProps<{
    isActive?: boolean;
  }>();
</script>

<template>
  <UButton
    variant="ghost"
    color="neutral"
    class="block size-full cursor-pointer"
    :class="[$style.hamburger, { [$style.isActive]: isActive }]"
  >
    <span
      v-for="key in 3"
      :key
      :class="$style.line"
      class="mx-auto my-1 block aspect-20/2 h-0.5 rounded-sm bg-current transition-all duration-300 ease-in-out"
    />
  </UButton>
</template>

<style lang="scss" module>
  .hamburger {
    &.isActive {
      .line {
        &:nth-child(2) {
          opacity: 0;
        }
        &:nth-child(1) {
          transform: translateY(6px) rotate(45deg) translate3d(0, 0, 0);
        }
        &:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg) translate3d(0, 0, 0);
        }
      }
    }

    &:hover:not(.isActive) {
      .line {
        &:nth-child(1) {
          transform: translateX(-6px) translate3d(0, 0, 0);
          width: 14px;
        }
      }
    }
  }
</style>
