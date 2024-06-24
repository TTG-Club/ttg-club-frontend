<script>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  export default defineComponent({
    components: {
      SvgIcon,
    },
  });
</script>

<template>
  <div class="icon-toast-close">
    <svg-icon icon="close" />
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .icon-toast-close {
    @include css_anim();

    opacity: 1;
    border-radius: 8px;

    &:hover {
      background-color: var(--hover);
    }
  }
</style>
