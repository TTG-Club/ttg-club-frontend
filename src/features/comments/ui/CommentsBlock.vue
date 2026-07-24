<script setup lang="ts">
  import { getCommentsTarget } from '../model';

  import CommentsSection from './CommentsSection.vue';

  const { path = undefined } = defineProps<{
    /**
     * Канонический путь деталки (`/spells/ognennyj-shar`) или её абсолютный
     * URL. По умолчанию берётся адрес текущего маршрута: деталки открываются
     * вложенным роутом, и их адрес совпадает с адресом обсуждения.
     */
    path?: string;
  }>();

  const route = useRoute();

  /**
   * Цель обсуждения; `null` — раздел без комментариев (мастерская, служебные
   * страницы, списки), блок не рендерится вовсе.
   */
  const target = computed(() => getCommentsTarget(path ?? route.path));
</script>

<template>
  <!--
    Ключ по url: боковая панель не перемонтируется при смене сущности,
    а состояние ленты в композабле привязано к треду с момента создания.
  -->
  <comments-section
    v-if="target"
    :key="target.url"
    :section="target.section"
    :url="target.url"
  />
</template>
