<script>
  export default {
    props: {
      treasure: {
        type: Object,
        default: () => ({}),
      },
    },
  };
</script>

<template>
  <div
    ref="treasure"
    :class="{ 'is-green': treasure?.source?.homebrew }"
    class="link-item"
  >
    <div class="link-item__content">
      <div class="link-item__body">
        <div class="link-item__row">
          <div
            v-tippy="{ content: treasure.name.rus }"
            class="link-item__name"
          >
            {{ treasure.name.rus }}
          </div>
        </div>

        <div class="link-item__row">
          <div
            v-tippy="{ content: treasure.source.name }"
            class="link-item__source"
          >
            {{ treasure.source.shortName }}
          </div>

          <div
            v-if="treasure.custom?.count"
            class="link-item__count"
          >
            x{{ treasure.custom.count }}
          </div>

          <div class="link-item__price">
            {{ treasure.custom?.price || treasure.price || 0 }} зм
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/link-item' as *;

  .link-item {
    &__name {
      max-width: 100%;
      width: auto;
    }

    &__source {
      display: flex;
      margin-right: 8px;
    }

    &__count,
    &__price {
      display: flex;
      margin-left: auto;
    }
  }
</style>
