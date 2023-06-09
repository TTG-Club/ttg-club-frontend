<template>
  <div
    v-if="description"
    class="content-padding"
  >
    <raw-content
      :template="description"
    />
  </div>

  <div
    v-for="group in groups"
    :key="group.name"
    class="screen-group"
  >
    <div
      v-if="group.name"
      class="screen-group__name"
    >
      {{ group.name }}
    </div>

    <div class="screen-group__list">
      <screen-link
        v-for="screenObj in group.list"
        :key="screenObj.url"
        :screen="screenObj"
        :to="{ path: screenObj.url }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import sortBy from 'lodash/sortBy';
  import groupBy from 'lodash/groupBy';
  import { computed } from 'vue';
  import ScreenLink from '@/views/Workshop/Screens/ScreenLink.vue';
  import RawContent from '@/components/content/RawContent.vue';

  defineOptions({
    inheritAttrs: false
  });

  const props = withDefaults(
    defineProps<{
      description?: '';
      childList: any[]
    }>(),
    {
      description: ''
    }
  );

  const groups = computed(() => {
    const hasGroups = sortBy(
      Object.values(groupBy(
        props.childList.filter(item => item.group),
        o => o.group
      ))
        .map(list => ({
          name: list[0].group,
          list: sortBy(list, [o => o.order, o => o.name.rus])
        })),
      [o => o.group]
    );

    const noGroup = props.childList.filter(item => !item.group);

    if (noGroup.length) {
      return [
        {
          list: sortBy(noGroup, [o => o.order, o => o.name.rus])
        },
        ...hasGroups
      ];
    }

    return hasGroups;
  });
</script>

<style lang="scss" scoped>
  .screen-group {
    width: 100%;

    &__name {
      background: var(--hover);
      // text-align: center;
      line-height: 50px;
      font-size: var(--h4-font-size);
      font-weight: 300;
      color: var(--text-color-title);
      font-family: 'Lora';
      margin: 16px 16px 0 16px;
      border-radius: 8px;
      padding: 0 16px;
    }

    &__list {
      width: 100%;
      display: grid;
      row-gap: 8px;
      column-gap: 8px;
      padding: 8px 16px;
      grid-template-columns: repeat(1, 1fr);

      @include media-min($sm) {
        grid-template-columns: repeat(2, 1fr);
      }

      @include media-min($md) {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  }
</style>
