<template>
  <router-link
    v-if="icon && url"
    v-tippy="{ content: name }"
    :to="{ path: url }"
    class="class-square"
  >
    <svg-icon
      :icon="icon"
    />
  </router-link>
</template>

<script>
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

  export default {
    name: 'ClassSquare',
    components: {
      SvgIcon
    },
    props: {
      name: {
        type: String,
        default: ''
      },
      icon: {
        type: String,
        default: ''
      },
      url: {
        type: String,
        default: ''
      }
    }
  };
</script>

<style lang="scss" scoped>
  // .class-square {
  //     @include css_anim();

  //     display: block;
  //     width: 48px;
  //     height: 48px;
  //     padding: 8px;
  //     background-repeat: no-repeat;
  //     background-position: center;
  //     background-color: var(--hover);
  //     border-radius: 8px;
  //     margin-right: 8px;
  //     cursor: pointer;
  //     color: var(--primary);

  //     &:hover {
  //         color: var(--link-color-hover);
  //     }
  // }
</style>
