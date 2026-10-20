<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import { useCreatureSummaries } from '@/features/initiative/composables';
  import type { TrackerParticipant } from '@/features/initiative/model';
  import { PARTICIPANT_TYPE_ICON } from '@/features/initiative/model';

  const {
    participants,
    currentParticipantId = undefined,
    round,
  } = defineProps<{
    participants: Array<TrackerParticipant>;
    currentParticipantId?: string;
    round: number;
  }>();

  const { imageFor, dropImage } = useCreatureSummaries(() => participants);

  /** Шаг между центрами соседних токенов, px. */
  const STEP = 96;

  /** Запас колонок слева/справа от центра (чуть шире любого вьюпорта). */
  const WINDOW = 8;

  interface TokenCell {
    kind: 'token';
    key: string;
    column: number;
    participant: TrackerParticipant;
    isCurrent: boolean;
  }

  interface DividerCell {
    kind: 'divider';
    key: string;
    column: number;
    round: number;
  }

  type ReelCell = TokenCell | DividerCell;

  const size = computed(() => participants.length);

  const currentIndex = computed(() => {
    const index = participants.findIndex(
      (participant) => participant.id === currentParticipantId,
    );

    return index < 0 ? 0 : index;
  });

  const currentName = computed(
    () => participants[currentIndex.value]?.name ?? '',
  );

  // Раунды трекера 1-based; страхуемся от 0/битого значения (в схеме
  // round.catch(0)) — иначе центр ленты уехал бы в несуществующую колонку и
  // ни один токен не получил бы подсветку «текущего».
  const safeRound = computed(() => Math.max(1, round));

  // Абсолютная «временная» координата: раунд * (N + 1) + позиция в порядке.
  // Один слот на раунд зарезервирован под разделитель — отсюда (N + 1). Так
  // координата монотонно растёт от раунда к раунду, и лента всегда едет влево.
  const currentColumn = computed(
    () => safeRound.value * (size.value + 1) + currentIndex.value,
  );

  const cells = computed<Array<ReelCell>>(() => {
    const total = size.value;

    if (total === 0) {
      return [];
    }

    const span = total + 1;
    const result: Array<ReelCell> = [];

    // Диапазон циклов выводим из окна ±WINDOW (с запасом в цикл по краям), а не
    // из фиксированного смещения — иначе при малом составе край ленты пустеет и
    // ломается «бесшовная» петля. Лишние ячейки всё равно отсекает фильтр окна.
    const from = Math.max(
      1,
      Math.floor((currentColumn.value - WINDOW) / span) - 1,
    );

    const to = Math.ceil((currentColumn.value + WINDOW) / span) + 1;

    for (let cycle = from; cycle <= to; cycle += 1) {
      const base = cycle * span;

      // Разделитель — «шапка» раунда: стоит перед его первым бойцом и несёт
      // номер начинающегося раунда. Перед первым раундом его не рисуем — до
      // него нет перехода, и метка «Раунд 1» рядом со стартовым бойцом (мы и
      // так уже в первом раунде) выглядела бы бессмысленно.
      if (cycle > 1) {
        result.push({
          kind: 'divider',
          key: `divider-${cycle}`,
          column: base - 1,
          round: cycle,
        });
      }

      for (const [index, participant] of participants.entries()) {
        result.push({
          kind: 'token',
          key: `${participant.id}-${cycle}`,
          column: base + index,
          participant,
          isCurrent: cycle === safeRound.value && index === currentIndex.value,
        });
      }
    }

    return result.filter(
      (cell) => Math.abs(cell.column - currentColumn.value) <= WINDOW,
    );
  });

  const trackStyle = computed(() => ({
    transform: `translateX(${-currentColumn.value * STEP}px)`,
  }));

  function cellStyle(column: number): Record<string, string> {
    return {
      left: `${column * STEP}px`,
      width: `${STEP}px`,
      marginLeft: `${-STEP / 2}px`,
    };
  }

  function typeIcon(participant: TrackerParticipant): string {
    return PARTICIPANT_TYPE_ICON[participant.type];
  }

  // Плавный сдвиг включаем только после первой отрисовки, иначе лента
  // «выезжала» бы из левого края при монтировании боя.
  const ready = ref(false);

  onMounted(async () => {
    await nextTick();
    ready.value = true;
  });
</script>

<template>
  <div class="reel">
    <!-- Лента чисто декоративна: очередь и текущий ход доносят список бойцов
         и подпись aria-live ниже, поэтому прячем её от скринридеров. -->
    <div
      class="reel__viewport"
      aria-hidden="true"
    >
      <div
        class="reel__track"
        :class="{ 'reel__track--ready': ready }"
        :style="trackStyle"
      >
        <TransitionGroup name="reel">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="reel__cell"
            :style="cellStyle(cell.column)"
          >
            <!-- Разделитель — шапка начинающегося раунда. -->
            <div
              v-if="cell.kind === 'divider'"
              class="reel__divider"
            >
              <div class="reel__divider-line" />

              <span class="reel__divider-label">Раунд {{ cell.round }}</span>

              <div class="reel__divider-gem" />

              <div class="reel__divider-line" />
            </div>

            <!-- Токен участника -->
            <div
              v-else
              class="reel__token"
            >
              <div class="reel__token-slot">
                <span
                  v-if="cell.isCurrent"
                  class="reel__halo"
                />

                <div
                  class="reel__ring"
                  :class="{
                    'reel__ring--current': cell.isCurrent,
                    'reel__ring--dead': cell.participant.dead,
                  }"
                >
                  <img
                    v-if="imageFor(cell.participant)"
                    :src="imageFor(cell.participant)"
                    alt=""
                    loading="lazy"
                    class="reel__image"
                    @error="dropImage(cell.participant.creatureUrl)"
                  />

                  <icon
                    v-else
                    :icon="typeIcon(cell.participant)"
                    class="reel__icon"
                    :class="{ 'reel__icon--current': cell.isCurrent }"
                  />

                  <span
                    v-if="typeof cell.participant.initiativeTotal === 'number'"
                    class="reel__badge"
                    :class="{ 'reel__badge--current': cell.isCurrent }"
                  >
                    {{ cell.participant.initiativeTotal }}
                  </span>

                  <icon
                    v-if="cell.participant.dead"
                    icon="tabler:skull"
                    class="reel__skull"
                  />
                </div>
              </div>

              <span
                class="reel__name"
                :class="{ 'reel__name--current': cell.isCurrent }"
              >
                {{ cell.participant.name }}
              </span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Живой регион всегда в DOM, меняется только текст. -->
    <div
      class="reel__caption"
      aria-live="polite"
    >
      <template v-if="currentName">
        <span class="reel__caption-hint">Сейчас ходит</span>

        <span class="reel__caption-name">{{ currentName }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .reel {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__viewport {
      position: relative;
      // Клип только по горизонтали: по бокам прячем уезжающие токены, но
      // свечение «текущего» свободно выходит вверх за рамку.
      overflow-x: clip;
      height: 176px;
    }

    &__track {
      pointer-events: none;
      position: absolute;
      left: 50%;
      inset-block: 0;

      &--ready {
        transition: transform 500ms ease-out;

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      }
    }

    &__cell {
      position: absolute;
      inset-block: 0;
    }

    &__divider {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      justify-content: center;

      height: 100%;
      padding-block: 24px;
    }

    &__divider-line {
      flex: 1 1 0;
      width: 1px;
      border-left: 1px dashed var(--border);
    }

    &__divider-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-g-color);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    &__divider-gem {
      transform: rotate(45deg);

      width: 10px;
      height: 10px;

      background-color: color-mix(in srgb, var(--primary) 20%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary) 60%, transparent);
    }

    &__token {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      justify-content: center;

      height: 100%;
    }

    &__token-slot {
      position: relative;

      display: grid;
      place-items: center;

      width: 80px;
      height: 80px;
    }

    &__halo {
      position: absolute;
      inset: 0;

      width: 96px;
      height: 96px;
      margin: auto;

      background-color: color-mix(in srgb, var(--primary) 25%, transparent);
      filter: blur(24px);
      border-radius: 50%;
    }

    &__ring {
      position: relative;

      display: grid;
      place-items: center;

      width: 56px;
      height: 56px;

      background-color: var(--bg-sub-menu);
      border: 2px solid var(--border);
      border-radius: 50%;

      transition: all 300ms;

      &--current {
        width: 80px;
        height: 80px;

        background-color: color-mix(in srgb, var(--primary) 10%, transparent);
        border-color: var(--primary);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
      }

      &--dead {
        opacity: 0.4;
        filter: grayscale(1);
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    }

    &__image {
      position: absolute;
      inset: 0;

      width: 100%;
      height: 100%;

      object-fit: cover;
      border-radius: 50%;
    }

    &__icon {
      width: 24px;
      height: 24px;
      color: var(--text-g-color);

      &--current {
        width: 32px;
        height: 32px;
        color: var(--primary);
      }
    }

    &__badge {
      position: absolute;
      bottom: -8px;

      padding: 0 6px;

      font-size: 12px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-g-color);

      background-color: var(--bg-sub-menu);
      border-radius: 999px;
      box-shadow: 0 0 0 1px var(--border);

      &--current {
        color: var(--text-btn-color);
        background-color: var(--primary);
        box-shadow: none;
      }
    }

    &__skull {
      position: absolute;
      width: 20px;
      height: 20px;
      color: var(--error);
    }

    &__name {
      overflow: hidden;

      max-width: 80px;

      font-size: 12px;
      color: var(--text-g-color);
      text-align: center;
      text-overflow: ellipsis;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      white-space: nowrap;

      &--current {
        font-weight: 600;
        color: var(--text-color-title);
      }
    }

    &__caption {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
    }

    &__caption-hint {
      font-size: 12px;
      color: var(--text-g-color);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    &__caption-name {
      overflow: hidden;

      max-width: 100%;

      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-title);
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .reel-enter-active,
  .reel-leave-active {
    transition: opacity 400ms ease;
  }

  .reel-enter-from,
  .reel-leave-to {
    opacity: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .reel__halo {
      animation: reel-halo-pulse 2400ms ease-in-out infinite;
    }
  }

  @keyframes reel-halo-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.5;
    }

    50% {
      transform: scale(1.08);
      opacity: 1;
    }
  }
</style>
