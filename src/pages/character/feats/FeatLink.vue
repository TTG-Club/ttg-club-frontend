<script setup lang="ts">
  import type { FeatsLinkItem } from '@/shared/types/character/Feats';

  defineOptions({
    inheritAttrs: false,
  });

  defineProps<{ feat: FeatsLinkItem }>();
</script>

<template>
  <router-link
    :to="{ path: feat.url }"
    class="link-item"
  >
    <div class="link-item__content">
      <div class="link-item__body">
        <div class="link-item__row">
          <div class="link-item__name">
            <span class="link-item__name--rus">
              {{ feat.name.rus }}
            </span>

            <span class="link-item__name--eng"> [{{ feat.name.eng }}] </span>
          </div>

          <div
            v-if="feat.source.group"
            v-tippy-lazy="{
              content: feat.source.group.name,
              touch: true,
            }"
            :style="{
              '--source-group-color': `var(--badge-${feat.source.group.shortName.toLowerCase()})`,
            }"
            class="link-item__source"
          >
            {{ feat.source.group.shortName }}
          </div>
        </div>

        <div class="link-item__row">
          <div class="link-item__requirements">
            {{ feat.requirements }}
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
