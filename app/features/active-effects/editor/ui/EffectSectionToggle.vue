<script setup lang="ts">
  import {
    EFFECT_SECTION_TOGGLE_ICON,
    EFFECT_SECTION_TOGGLE_UI,
  } from '../../model';

  /**
   * Кнопка раскрытия сворачиваемого раздела формы эффекта: иконка и подпись
   * раздела, справа стрелка, которая поворачивается, пока раздел открыт.
   * Кладётся в `UCollapsible` первым потомком — нажатие и состояние раздела
   * кнопка получает от него атрибутами.
   */
  defineProps<{
    /** Иконка раздела. */
    icon: string;
    /** Подпись раздела. */
    label: string;
  }>();
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    size="sm"
    :icon="icon"
    :trailing-icon="EFFECT_SECTION_TOGGLE_ICON"
    :label="label"
    class="w-full justify-start"
    :ui="EFFECT_SECTION_TOGGLE_UI"
  />
</template>
