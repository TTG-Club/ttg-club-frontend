<script setup lang="ts">
  import type { TrackerParticipant } from '../model';

  import {
    getTurnReel,
    INITIATIVE_ICON,
    INITIATIVE_TEXT,
    isParticipantRolled,
    PARTICIPANT_TYPE_META,
    TURN_REEL,
  } from '../model';

  /**
   * Лента ходов над участниками боя: текущий в центре, с каждым ходом лента
   * уезжает влево, раунды разделены границей. Порядок для скринридера
   * объявляет подпись под лентой.
   */
  const {
    participants,
    currentId = undefined,
    round,
    avatars,
  } = defineProps<{
    participants: ReadonlyArray<TrackerParticipant>;
    currentId?: string | null;
    round: number;
    /** Картинки существ по идентификатору участника. */
    avatars: Record<string, string | undefined>;
  }>();

  /** Плавный сдвиг включается после первой отрисовки, чтобы лента не выезжала. */
  const isReady = ref(false);

  const reel = computed(() => getTurnReel(participants, currentId, round));

  const trackStyle = computed(() => ({
    transform: `translateX(${-reel.value.column * TURN_REEL.step}px)`,
  }));

  const trackClass = computed(() =>
    isReady.value
      ? 'motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out'
      : undefined,
  );

  const currentName = computed(
    () =>
      participants.find((participant) => participant.id === currentId)?.name,
  );

  onMounted(async () => {
    await nextTick();
    isReady.value = true;
  });

  /**
   * Положение ячейки на ленте.
   * @param column - колонка ячейки
   */
  function getCellStyle(column: number): Record<string, string> {
    return {
      left: `${column * TURN_REEL.step}px`,
      width: `${TURN_REEL.step}px`,
      marginLeft: `${-TURN_REEL.step / 2}px`,
    };
  }

  /**
   * Кольцо токена: текущий крупнее и подсвечен, поверженный блёклый.
   * @param participant - участник
   * @param isCurrent - сейчас его ход
   */
  function getRingClass(
    participant: TrackerParticipant,
    isCurrent: boolean,
  ): Array<string> {
    return [
      isCurrent
        ? 'size-20 ring-2 ring-primary shadow-lg'
        : 'size-14 ring-2 ring-default',
      participant.dead ? 'opacity-40 grayscale' : '',
    ];
  }

  /**
   * Иконка токена без картинки.
   * @param participant - участник
   */
  function getIcon(participant: TrackerParticipant): string {
    return PARTICIPANT_TYPE_META[participant.type].icon;
  }

  /**
   * Плашка инициативы: у текущего залита основным цветом.
   * @param isCurrent - сейчас его ход
   */
  function getBadgeClass(isCurrent: boolean): string {
    return isCurrent
      ? 'bg-primary text-white'
      : 'bg-elevated text-muted ring-1 ring-default';
  }

  /**
   * Имя под токеном.
   * @param isCurrent - сейчас его ход
   */
  function getNameClass(isCurrent: boolean): string {
    return isCurrent ? 'font-semibold text-highlighted' : 'text-muted';
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="relative h-40 overflow-x-clip"
      aria-hidden="true"
    >
      <div
        class="pointer-events-none absolute inset-y-0 left-1/2"
        :class="trackClass"
        :style="trackStyle"
      >
        <TransitionGroup
          enter-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-300"
          leave-to-class="opacity-0"
        >
          <div
            v-for="cell in reel.cells"
            :key="cell.key"
            class="absolute inset-y-0"
            :style="getCellStyle(cell.column)"
          >
            <div
              v-if="cell.kind === 'divider'"
              class="flex h-full flex-col items-center justify-center gap-1.5 py-6"
            >
              <div class="w-px flex-1 border-l border-dashed border-default" />

              <span
                class="text-xs font-semibold tracking-widest text-muted uppercase"
              >
                {{ INITIATIVE_TEXT.round }} {{ cell.round }}
              </span>

              <div class="w-px flex-1 border-l border-dashed border-default" />
            </div>

            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-2"
            >
              <div class="relative grid size-20 place-items-center">
                <span
                  v-if="cell.isCurrent"
                  class="absolute inset-0 rounded-full bg-primary/25 blur-xl motion-safe:animate-pulse"
                />

                <UAvatar
                  :src="avatars[cell.participant.id]"
                  :icon="getIcon(cell.participant)"
                  :alt="cell.participant.name"
                  color="neutral"
                  class="bg-elevated transition-all motion-safe:duration-300"
                  :class="getRingClass(cell.participant, cell.isCurrent)"
                  :ui="{ icon: 'size-6' }"
                />

                <span
                  v-if="isParticipantRolled(cell.participant)"
                  class="absolute -bottom-1 rounded-full px-1.5 text-xs font-bold tabular-nums"
                  :class="getBadgeClass(cell.isCurrent)"
                >
                  {{ cell.participant.initiativeTotal }}
                </span>

                <UIcon
                  v-if="cell.participant.dead"
                  :name="INITIATIVE_ICON.kill"
                  class="absolute size-5 text-error"
                />
              </div>

              <span
                class="max-w-20 truncate text-xs tracking-wide uppercase"
                :class="getNameClass(cell.isCurrent)"
              >
                {{ cell.participant.name }}
              </span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <div
      class="flex flex-col items-center gap-0.5"
      aria-live="polite"
    >
      <template v-if="currentName">
        <span class="text-xs tracking-widest text-muted uppercase">
          {{ INITIATIVE_TEXT.currentTurn }}
        </span>

        <span
          class="max-w-full truncate text-lg font-semibold text-highlighted"
        >
          {{ currentName }}
        </span>
      </template>
    </div>
  </div>
</template>
