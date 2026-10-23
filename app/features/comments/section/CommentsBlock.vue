<script setup lang="ts">
  import { getCommentsTarget } from '../model';
  import CommentsSection from './CommentsSection.vue';

  /**
   * Комментарии записи. Обёртки записи передают только её адрес, а нужно ли
   * обсуждение и с каким ключом, блок решает сам.
   */
  const { path } = defineProps<{
    /** Адрес записи, например `/spells/fireball`. */
    path: string;
  }>();

  /** Тред записи; `null` — у раздела нет комментариев. */
  const target = computed(() => getCommentsTarget(path));
</script>

<template>
  <!--
    Ключ по адресу: панель рядом со списком не перемонтируется при смене
    записи, а состояние ленты привязано к треду с момента создания.
  -->
  <CommentsSection
    v-if="target"
    :key="target.url"
    class="mt-6"
    :target="target"
  />
</template>
