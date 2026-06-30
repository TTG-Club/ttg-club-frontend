<script setup lang="ts">
  import type { BackgroundItem } from '@/shared/types/character/Backgrounds';
  import RawContent from '@/shared/ui/RawContent.vue';
  import RollTable from '@/shared/ui/RollTable.vue';

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
          <b>Владение инструментами:</b>&nbsp;

          <raw-content
            :template="background.toolOwnership"
            tag="span"
          />
        </li>

        <li v-if="background.languages?.length">
          <b>Языки:</b> {{ background.languages.join(', ') }}
        </li>

        <li v-if="background.equipments?.length">
          <b>Снаряжение:</b>&nbsp;

          <raw-content
            :template="background.equipments.join(', ')"
            tag="span"
          />
        </li>

        <li v-if="background.startGold != null">
          <b>Начальный капитал:</b> {{ background.startGold }} зм.
        </li>
      </ul>

      <template v-if="background.description">
        <h4 class="header_separator"><span>Описание</span></h4>

        <raw-content :template="background.description" />
      </template>

      <template v-if="background.skillName || background.skillDescription">
        <h4 class="header_separator">
          <span>{{ background.skillName || 'Умение предыстории' }}</span>
        </h4>

        <raw-content
          v-if="background.skillDescription"
          :template="background.skillDescription"
        />
      </template>

      <template
        v-if="
          background.personalization || background.personalizationTables?.length
        "
      >
        <h4 class="header_separator"><span>Персонализация</span></h4>

        <raw-content
          v-if="background.personalization"
          :template="background.personalization"
        />

        <div
          v-for="table in background.personalizationTables"
          :key="table.name"
          class="table-responsive"
        >
          <roll-table :table="table" />
        </div>
      </template>
    </div>
  </div>
</template>
