<script setup lang="ts">
  import type { BackgroundItem } from '@/shared/types/character/Backgrounds';
  import RawContent from '@/shared/ui/RawContent.vue';

  import DetailTopBar from '@/features/DetailTopBar.vue';

  defineProps<{
    background: BackgroundItem;
  }>();
</script>

<template>
  <div class="background-body">
    <detail-top-bar
      left=" "
      :source="background.source"
    />

    <div class="background-body__desc content-padding">
      <ul class="stat-list">
        <li v-if="background.skills?.length">
          <b>Владение навыками:</b> {{ background.skills.join(', ') }}
        </li>

        <li v-if="background.toolOwnership">
          <b>Владение инструментами:</b>

          <raw-content
            :template="background.toolOwnership"
            tag="span"
          />
        </li>

        <li v-if="background.languages?.length">
          <b>Языки:</b> {{ background.languages.join(', ') }}
        </li>

        <li v-if="background.equipments?.length">
          <b>Снаряжение:</b> {{ background.equipments.join(', ') }}
        </li>

        <li v-if="background.startGold != null">
          <b>Начальный капитал:</b> {{ background.startGold }} зм.
        </li>
      </ul>

      <template v-if="background.description">
        <h4 class="header_separator"><span>Описание</span></h4>

        <raw-content :template="background.description" />
      </template>

      <template v-if="background.personalization">
        <h4 class="header_separator"><span>Персонализация</span></h4>

        <raw-content :template="background.personalization" />
      </template>
    </div>
  </div>
</template>
