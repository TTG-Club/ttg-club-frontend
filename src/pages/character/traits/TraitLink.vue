<script>
  export default {
    inheritAttrs: false,
    props: {
      traitItem: {
        type: Object,
        required: true,
      },
    },
  };
</script>

<template>
  <router-link
    :class="{ 'is-green': traitItem?.homebrew }"
    :to="{ path: traitItem.url }"
    class="link-item"
  >
    <div class="link-item__content">
      <div class="link-item__body">
        <div class="link-item__row">
          <div class="link-item__name">
            <span class="link-item__name--rus">
              {{ traitItem.name.rus }}
            </span>

            <span class="link-item__name--eng">
              [{{ traitItem.name.eng }}]
            </span>
          </div>
        </div>

        <div class="link-item__row">
          <div class="link-item__requirements">
            {{ traitItem.requirements }}
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item' as *;

  .link-item {
    &__requirements {
      color: var(--text-g-color);
      font-size: calc(var(--main-font-size) - 1px);
      line-height: normal;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.router-link-active {
      .link-item {
        &__requirements {
          color: var(--text-btn-color);
        }
      }
    }
  }
</style>
