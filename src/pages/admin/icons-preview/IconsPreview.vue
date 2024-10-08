<script setup lang="ts">
  import { useToast } from 'vue-toastification';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { icons } from '@/shared/utils/icons';

  import PageLayout from '@/layouts/PageLayout.vue';

  const toast = useToast();

  const search = ref('');

  const newIcons = computed<Array<string>>(() =>
    icons.filter((name) => {
      const regex = new RegExp(search.value, 'gi');

      return regex.test(name);
    }),
  );

  const copyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);

      toast.success(`Название «${name}» скопировано в буфер обмена`);
    } catch (err) {
      toast.error('Ошибка копирования названия иконки');
    }
  };
</script>

<template>
  <page-layout>
    <template #title>Предпросмотр иконок</template>

    <template #default>
      <n-input
        v-model:value="search"
        placeholder="Поиск..."
      />

      <div :class="$style.icons">
        <n-tooltip
          v-for="icon in newIcons"
          :key="icon"
        >
          <template #trigger>
            <div
              :class="$style.item"
              @click="copyName(icon)"
            >
              <div :class="$style.icon">
                <svg-icon
                  :icon="icon"
                  size="32"
                />
              </div>

              <div :class="$style.name">{{ icon }}</div>
            </div>
          </template>

          <template #default>
            {{ icon }}
          </template>
        </n-tooltip>
      </div>
    </template>
  </page-layout>
</template>

<style module lang="scss">
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    width: 100%;
    margin-top: 12px;
  }

  .item {
    cursor: pointer;

    display: flex;
    flex-direction: column;
    align-items: center;

    width: calc((100% - 8px * 2) / 3);
    padding: 8px;

    color: var(--text-color);

    background-color: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 8px;

    transition: color 0.15s ease-in-out;

    @include media-min($sm) {
      width: calc((100% - 8px * 3) / 4);
    }

    @include media-min($md) {
      width: calc((100% - 8px * 4) / 5);
    }

    @include media-min($lg) {
      width: calc((100% - 8px * 5) / 6);
    }

    @include media-min($xl) {
      width: calc((100% - 8px * 7) / 8);
    }

    &:hover {
      color: var(--primary);
      transition: color 0.15s ease-in-out;
    }
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 64px;
    height: 64px;
    padding: 8px;
  }

  .name {
    overflow: hidden;
    display: block;

    width: 100%;

    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
