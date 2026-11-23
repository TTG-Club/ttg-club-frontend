<script setup lang="ts">
  import { useCharacterSheet, useSheetStats } from '../composables';
  import { getHitPointsToneClass, HEALTH_TEXT } from '../model';
  import SheetDeathSaves from './SheetDeathSaves.vue';
  import SheetHitPointsControls from './SheetHitPointsControls.vue';

  /**
   * Быстрое окно хитов на запертом листе, как на new.ttg.club: живое число
   * хитов, шаги урона и лечения, поле «точное значение или сдвиг», а при 0
   * хитов — спасброски от смерти. Настройка максимума и костей хитов — в
   * полном окне здоровья, оно открывается на отпертом листе.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document } = useCharacterSheet();
  const { stats } = useSheetStats();

  const health = computed(() => document.value.health);

  const valueClass = computed(() =>
    getHitPointsToneClass(health.value.current, stats.value.hitPointsMax),
  );

  const isDying = computed(
    () => stats.value.hitPointsMax > 0 && health.value.current === 0,
  );

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="HEALTH_TEXT.quickTitle"
    :ui="{ content: 'max-w-sm' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-end justify-center gap-2">
          <span
            class="text-4xl leading-none font-bold tabular-nums"
            :class="valueClass"
          >
            {{ health.current }}
          </span>

          <span class="pb-1 text-xl leading-none text-muted">
            / {{ stats.hitPointsMax }}
          </span>

          <span
            v-if="health.temporary > 0"
            class="pb-1 text-xl leading-none font-bold text-primary"
          >
            +{{ health.temporary }}
          </span>
        </div>

        <SheetHitPointsControls />

        <template v-if="isDying">
          <USeparator />

          <p class="text-xs text-dimmed">{{ HEALTH_TEXT.dyingHint }}</p>

          <SheetDeathSaves />
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          :label="HEALTH_TEXT.done"
          @click.left.exact.prevent="close"
        />
      </div>
    </template>
  </UModal>
</template>
