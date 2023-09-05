<template>
  <div
    class="navbar__btn"
    @click.left.exact.prevent="switchTheme"
  >
    <svg-icon :icon="`theme/${icon}`" />
  </div>
</template>

<script>
  import { computed } from 'vue';

  import { useUIStore } from '@/shared/stores/UIStore.ts';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  export default {
    components: { SvgIcon },
    setup() {
      const uiStore = useUIStore();

      const icon = computed(() =>
        uiStore.theme === 'dark' ? 'light' : 'dark'
      );

      const switchTheme = async () => {
        await uiStore.setTheme({ name: icon.value });
      };

      return {
        icon,
        switchTheme
      };
    }
  };
</script>
