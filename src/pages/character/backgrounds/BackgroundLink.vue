<script>
  import { CapitalizeFirst } from '@/shared/directives/CapitalizeFirst.ts';

  export default {
    directives: {
      CapitalizeFirst,
    },
    props: {
      backgroundItem: {
        type: Object,
        required: true,
      },
    },
  };
</script>

<template>
  <router-link
    :to="{ path: backgroundItem.url }"
    class="link-item"
  >
    <div class="link-item__content">
      <div class="link-item__body">
        <div class="link-item__row">
          <div class="link-item__name">
            <span class="link-item__name--rus">
              {{ backgroundItem.name.rus }}
            </span>

            <span class="link-item__name--eng">
              [{{ backgroundItem.name.eng }}]
            </span>
          </div>

          <div
            v-if="backgroundItem.source.group"
            v-tippy-lazy="{
              content: backgroundItem.source.group.name,
              touch: true,
            }"
            :style="{
              '--source-group-color': `var(--badge-${backgroundItem.source.group?.shortName.toLowerCase()})`,
            }"
            class="link-item__source"
          >
            {{ backgroundItem.source.group.shortName }}
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
