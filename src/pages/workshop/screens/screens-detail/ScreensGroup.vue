<script setup lang="ts">
  import { groupBy, sortBy } from 'lodash-es';

  import RawContent from '@/shared/ui/RawContent.vue';

  import ScreenLink from '@/pages/workshop/screens/ScreenLink.vue';

  defineOptions({
    inheritAttrs: false,
  });

  const props = withDefaults(
    defineProps<{
      description?: '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      childList: any[];
    }>(),
    {
      description: '',
    },
  );

  const groups = computed(() => {
    const hasGroups = sortBy(
      Object.values(
        groupBy(
          props.childList.filter((item) => item.group),
          (o) => o.group,
        ),
      ).map((list) => ({
        name: list[0].group,
        list: sortBy(list, [(o) => o.order, (o) => o.name.rus]),
      })),
      [(o) => o.group],
    );

    const noGroup = props.childList.filter((item) => !item.group);

    if (noGroup.length) {
      return [
        {
          list: sortBy(noGroup, [(o) => o.order, (o) => o.name.rus]),
        },
        ...hasGroups,
      ];
    }

    return hasGroups;
  });
</script>

<template>
  <div
    v-if="description"
    class="content-padding"
  >
    <raw-content :template="description" />
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

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .screen-group {
    width: 100%;

    &__name {
      margin: 16px 16px 0 16px;
      padding: 0 16px;

      font-size: var(--h4-font-size);
      font-weight: 300;
      // text-align: center;
      line-height: 50px;
      color: var(--text-color-title);

      background: var(--hover);
      border-radius: 8px;

      @include media-min($xl) {
        margin: 16px 24px 0 24px;
      }
    }

    &__list {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      row-gap: 8px;
      column-gap: 8px;

      width: 100%;
      padding: 8px 16px;

      @include media-min($sm) {
        grid-template-columns: repeat(2, 1fr);
      }

      @include media-min($md) {
        grid-template-columns: repeat(3, 1fr);
      }

      @include media-min($xl) {
        padding: 8px 24px;
      }
    }
  }
</style>
