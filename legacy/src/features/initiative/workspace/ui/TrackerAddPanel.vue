<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import CreatureAddForm from './CreatureAddForm.vue';
  import PlayerAddForm from './PlayerAddForm.vue';

  const {
    open = false,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    isMutating = false,
  } = defineProps<{
    open?: boolean;
    playerCount: number;
    creatureCount: number;
    canAddPlayer: boolean;
    canAddCreature: boolean;
    remainingCreatures: number;
    isMutating?: boolean;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    'add-player': [name: string, bonus: number];
    'add-creatures': [url: string, count: number, name?: string];
  }>();

  function onAddPlayer(name: string, bonus: number): void {
    emit('add-player', name, bonus);
  }

  function onAddCreatures(url: string, count: number, name?: string): void {
    emit('add-creatures', url, count, name);
  }
</script>

<template>
  <div class="add-panel">
    <n-button
      secondary
      block
      @click="emit('update:open', !open)"
    >
      <template #icon>
        <icon :icon="open ? 'tabler:chevron-up' : 'tabler:user-plus'" />
      </template>

      {{ open ? 'Скрыть добавление' : 'Добавить участника' }}
    </n-button>

    <div
      v-if="open"
      class="add-panel__forms"
    >
      <player-add-form
        :count="playerCount"
        :disabled="!canAddPlayer"
        :loading="isMutating"
        @add="onAddPlayer"
      />

      <creature-add-form
        class="add-panel__creature-form"
        :count="creatureCount"
        :disabled="!canAddCreature"
        :loading="isMutating"
        :remaining="remainingCreatures"
        @add="onAddCreatures"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
  .add-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__forms {
      display: grid;
      gap: 16px;
      align-items: start;

      @include media-min($md) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    &__creature-form {
      @include media-min($md) {
        grid-column: span 2;
      }
    }
  }
</style>
