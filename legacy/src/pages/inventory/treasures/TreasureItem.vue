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
  <div class="link-item">
    <div class="link-item__content">
      <div class="link-item__body">
        <div class="link-item__row">
          <div class="link-item__name">
            <span
              v-tippy="{ content: treasure.name.rus }"
              class="link-item__name--rus"
            >
              {{ treasure.name.rus }}
            </span>
          </div>

          <div
            v-if="treasure.source.group"
            v-tippy-lazy="{
              content: treasure.source.group.name,
              touch: true,
            }"
            :style="{
              '--source-group-color': `var(--badge-${treasure.source.group.shortName.toLowerCase()})`,
            }"
            class="link-item__source"
          >
            {{ treasure.source.group.shortName }}
          </div>
        </div>

        <div class="link-item__row">
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
    &__count,
    &__price {
      display: flex;
      margin-left: auto;
    }
  }
</style>
