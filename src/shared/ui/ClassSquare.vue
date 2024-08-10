<script>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  export default {
    name: 'ClassSquare',
    components: {
      SvgIcon,
    },
    props: {
      name: {
        type: String,
        default: '',
      },
      icon: {
        type: String,
        default: '',
      },
      url: {
        type: String,
        default: '',
      },
    },
  };
</script>

<template>
  <router-link
    v-if="icon && url"
    v-tippy="{ content: name }"
    :to="{ path: url }"
    class="class-square"
  >
    <svg-icon :icon="icon" />
  </router-link>
</template>
