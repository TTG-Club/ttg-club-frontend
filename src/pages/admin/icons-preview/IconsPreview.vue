<script setup lang="ts">
  import { useToast } from 'vue-toastification';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
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
      <ui-input
        v-model="search"
        :class="$style.search"
        placeholder="Поиск..."
      />

      <div :class="$style.icons">
        <div
          v-for="icon in newIcons"
          :key="icon"
          v-tippy="{ content: icon }"
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
      </div>
    </template>
  </page-layout>
</template>

<style module lang="scss">
  .icons {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .item {
    padding: 8px;
    display: flex;
    align-items: center;
    flex-direction: column;
    cursor: pointer;
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: color 0.15s ease-in-out;
    background-color: var(--bg-main);
    color: var(--text-color);
    width: calc((100% - 8px * 2) / 3);

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
    width: 100%;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    white-space: nowrap;
  }
</style>
