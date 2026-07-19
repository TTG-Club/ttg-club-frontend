<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { clamp } from 'lodash-es';
  import { h } from 'vue';

  import { useCreatureSummaries } from '@/features/initiative/composables';
  import type {
    TrackerParticipant,
    UpdateParticipantRequest,
  } from '@/features/initiative/model';
  import {
    extractArmorClassValue,
    formatInitiativeBonus,
    getCreatureRoute,
    MAX_INITIATIVE_BONUS,
    MIN_INITIATIVE_BONUS,
    PARTICIPANT_TYPE_LABEL,
  } from '@/features/initiative/model';

  import ParticipantArmorClassControl from './ParticipantArmorClassControl.vue';
  import ParticipantAvatar from './ParticipantAvatar.vue';
  import ParticipantHitPointsControl from './ParticipantHitPointsControl.vue';
  import ParticipantRenameControl from './ParticipantRenameControl.vue';
  import ParticipantRollControl from './ParticipantRollControl.vue';
  import ParticipantStatTile from './ParticipantStatTile.vue';

  import type { DropdownOption } from 'naive-ui';

  const {
    participant,
    isActive = false,
    isCurrent = false,
    order = 0,
    disabled = false,
    currentHitPoints = undefined,
    maxHitPointsOverride = undefined,
    playerArmorClass = undefined,
  } = defineProps<{
    participant: TrackerParticipant;
    /** Идёт бой: бонус — только чтение. Макет строки от режима не меняется. */
    isActive?: boolean;
    isCurrent?: boolean;
    order?: number;
    disabled?: boolean;
    /** Текущие хиты из localStorage (нет записи — существо на полных). */
    currentHitPoints?: number;
    /** Прокинутый максимум хитов (нет записи — среднее из статблока). */
    maxHitPointsOverride?: number;
    /** КД игрока из localStorage (нет записи — не задан). */
    playerArmorClass?: number;
  }>();

  const emit = defineEmits<{
    'edit': [id: string, patch: UpdateParticipantRequest];
    'remove': [id: string];
    'roll': [id: string];
    'toggle-dead': [id: string, dead: boolean];
    'set-hit-points': [id: string, value: number];
    'set-max-hit-points': [id: string, value: number];
    'set-armor-class': [id: string, value: number];
  }>();

  const { imageFor, summaryFor, dropImage } = useCreatureSummaries(() => [
    participant,
  ]);

  const bonus = ref(participant.initiativeBonus);

  const isDead = computed(() => participant.dead);

  const summary = computed(() => summaryFor(participant));

  const typeLabel = computed(
    // Схема допускает пустой `typeName` (catch('')) — тогда своя подпись.
    () => participant.typeName || PARTICIPANT_TYPE_LABEL[participant.type],
  );

  // Вторая строка идентификации: тип участника, существам — ещё и опасность.
  const subtitle = computed(() => {
    const challengeRating = summary.value?.challengeRating;

    return challengeRating
      ? `${typeLabel.value} · ПО ${challengeRating}`
      : typeLabel.value;
  });

  const armorClassText = computed(() => summary.value?.armorClass ?? '');

  const armorClassValue = computed(() =>
    extractArmorClassValue(armorClassText.value),
  );

  const armorClassDisplay = computed(() => armorClassValue.value || '—');

  // Прокинутый максимум приоритетнее среднего из статблока.
  const maxHitPoints = computed(
    () => maxHitPointsOverride ?? summary.value?.maxHitPoints ?? 0,
  );

  const hitFormula = computed(() => summary.value?.hitFormula ?? '');

  // Полная строка статблока («15 (кожаный доспех)») — в тултипе и только
  // когда она содержит что-то сверх числа из плитки.
  const hasArmorClassDetails = computed(
    () => armorClassText.value.trim() !== armorClassDisplay.value,
  );

  const armorClassTooltip = computed(() => `КД: ${armorClassText.value}`);

  // В подготовке показываем локальный черновик (реагирует на шаги ±), в бою —
  // серверное значение.
  const formattedBonus = computed(() =>
    formatInitiativeBonus(isActive ? participant.initiativeBonus : bonus.value),
  );

  const canDecreaseBonus = computed(
    () => !disabled && bonus.value > MIN_INITIATIVE_BONUS,
  );

  const canIncreaseBonus = computed(
    () => !disabled && bonus.value < MAX_INITIATIVE_BONUS,
  );

  /** Рендерит иконку опции меню. */
  function renderMenuIcon(icon: string) {
    return () => h(Icon, { icon });
  }

  const menuOptions = computed<Array<DropdownOption>>(() => {
    const options: Array<DropdownOption> = [];

    const { creatureUrl } = participant;

    // Явный пункт остаётся в меню как подсказка о поведении клика по строке.
    if (creatureUrl) {
      options.push({
        label: 'Статблок в новой вкладке',
        key: 'open-blank',
        icon: renderMenuIcon('tabler:external-link'),
      });
    }

    // Повержение — только в бою, спрятано в меню, чтобы трейлинг строки был
    // одинаков в правке и просмотре.
    if (isActive) {
      options.push(
        isDead.value
          ? {
              label: 'Вернуть в бой',
              key: 'revive',
              icon: renderMenuIcon('tabler:heart'),
              props: { style: { color: 'var(--success)' } },
            }
          : {
              label: 'Пометить повержённым',
              key: 'kill',
              icon: renderMenuIcon('tabler:skull'),
              props: { style: { color: 'var(--error)' } },
            },
      );
    }

    options.push({
      label: isActive ? 'Удалить из боя' : 'Убрать из энкаунтера',
      key: 'remove',
      icon: renderMenuIcon('tabler:trash'),
      props: { style: { color: 'var(--error)' } },
    });

    return options;
  });

  function onMenuSelect(key: string): void {
    const { creatureUrl } = participant;

    switch (key) {
      case 'open-blank':
        if (creatureUrl) {
          window.open(getCreatureRoute(creatureUrl), '_blank', 'noopener');
        }

        break;
      case 'revive':
        emit('toggle-dead', participant.id, false);

        break;
      case 'kill':
        emit('toggle-dead', participant.id, true);

        break;
      case 'remove':
        emit('remove', participant.id);

        break;
      default:
        break;
    }
  }

  // Ресинхронизация локального бонуса после ответа сервера (участник приходит
  // новым объектом). Присвоение здесь не даёт лишнего PUT: watch(bonus) ниже
  // выходит по guard-у `value === participant.initiativeBonus`.
  watch(
    () => participant.initiativeBonus,
    (value) => {
      bonus.value = value;
    },
  );

  // Цикл watch(bonus) → PUT → новый participant → watch(participant) → bonus
  // разрывается проверкой равенства: после ресинка значение уже совпадает.
  watch(bonus, (value) => {
    if (value === participant.initiativeBonus) {
      return;
    }

    emit('edit', participant.id, { initiativeBonus: value });
  });

  // Откат локального бонуса к серверному по завершении мутации: неуспешный PUT
  // не меняет participant, поэтому watch выше не сработает и в поле осталось бы
  // отклонённое значение.
  watch(
    () => disabled,
    (isNowDisabled, wasDisabled) => {
      if (wasDisabled && !isNowDisabled) {
        bonus.value = participant.initiativeBonus;
      }
    },
  );

  /**
   * Клик по «пустому» месту строки существа открывает его статблок в новой вкладке.
   * Клики, дошедшие от интерактивных элементов (кнопки, поля, ссылки), — не
   * навигация: у них своя логика, поэтому пропускаем их.
   * @param event Событие клика по строке.
   */
  function onRowClick(event: MouseEvent): void {
    const { creatureUrl } = participant;

    if (!creatureUrl) {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest('button, input, a')
    ) {
      return;
    }

    window.open(getCreatureRoute(creatureUrl), '_blank', 'noopener');
  }

  /**
   * Сдвигает бонус инициативы на шаг в пределах допустимого диапазона.
   * @param delta Направление шага: `1` или `-1`.
   */
  function adjustBonus(delta: number): void {
    bonus.value = clamp(
      bonus.value + delta,
      MIN_INITIATIVE_BONUS,
      MAX_INITIATIVE_BONUS,
    );
  }

  function onRename(id: string, name: string): void {
    emit('edit', id, { name });
  }

  function onChangeHitPoints(value: number): void {
    emit('set-hit-points', participant.id, value);
  }

  /**
   * Пробрасывает прокинутый максимум хитов с id участника.
   * @param value Новый максимум хитов.
   */
  function onSetMaxHitPoints(value: number): void {
    emit('set-max-hit-points', participant.id, value);
  }

  /**
   * Пробрасывает новый КД игрока с id участника.
   * @param value Новое значение КД.
   */
  function onChangeArmorClass(value: number): void {
    emit('set-armor-class', participant.id, value);
  }

  function onRoll(id: string): void {
    emit('roll', id);
  }

  function onSetRoll(id: string, roll: number): void {
    emit('edit', id, { initiativeRoll: roll });
  }
</script>

<template>
  <div
    class="participant-row"
    :class="{
      'participant-row--current': isActive && !isDead && isCurrent,
      'participant-row--dead-active': isActive && isDead,
      'participant-row--interactive': Boolean(participant.creatureUrl),
      'participant-row--locked': !isActive && disabled,
    }"
    @click.left.exact="onRowClick"
  >
    <!-- Идентификация: номер + аватар + имя с подписью типа/опасности. -->
    <div class="participant-row__identity">
      <span class="participant-row__order">{{ order }}</span>

      <participant-avatar
        :participant="participant"
        :image="imageFor(participant)"
        :class="{ 'participant-row__avatar--dead': isDead }"
        @image-error="dropImage(participant.creatureUrl)"
      />

      <div class="participant-row__names">
        <div class="participant-row__name-row">
          <span
            class="participant-row__name"
            :class="{ 'participant-row__name--dead': isDead }"
          >
            {{ participant.name }}
          </span>

          <participant-rename-control
            class="participant-row__rename"
            :participant="participant"
            :disabled="disabled"
            @rename="onRename"
          />
        </div>

        <div class="participant-row__subtitle">
          {{ subtitle }}
        </div>
      </div>
    </div>

    <!-- Статы: одинаковые плитки КД/Бонус/Иниц. фиксированной ширины + меню. -->
    <div class="participant-row__stats">
      <!-- Группа выживаемости (Хиты, КД) -->
      <div class="participant-row__group participant-row__group--survival">
        <div class="participant-row__cell participant-row__cell--hp">
          <participant-hit-points-control
            :current="currentHitPoints"
            :max="maxHitPoints"
            :formula="hitFormula"
            :disabled="disabled"
            :is-player="participant.type === 'PLAYER'"
            @change="onChangeHitPoints"
            @set-max="onSetMaxHitPoints"
          />
        </div>

        <div class="participant-row__cell participant-row__cell--ac">
          <!-- Игроку КД задаёт мастер вручную, существам — из статблока. -->
          <participant-armor-class-control
            v-if="participant.type === 'PLAYER'"
            :current="playerArmorClass"
            :disabled="disabled"
            :class="{ 'participant-row__dimmed': isDead }"
            @change="onChangeArmorClass"
          />

          <n-tooltip
            v-else
            trigger="hover"
            :disabled="!hasArmorClassDetails"
          >
            <template #trigger>
              <participant-stat-tile
                label="КД"
                class="participant-row__ac-tile"
                :class="{ 'participant-row__dimmed': isDead }"
              >
                {{ armorClassDisplay }}
              </participant-stat-tile>
            </template>

            {{ armorClassTooltip }}
          </n-tooltip>
        </div>
      </div>

      <!-- Группа инициативы и действий (Бонус, Иниц, Меню) -->
      <div class="participant-row__group participant-row__group--initiative">
        <participant-stat-tile
          label="Бонус"
          class="participant-row__cell participant-row__cell--bonus"
          :class="{ 'participant-row__dimmed': isDead }"
        >
          <template v-if="!isActive">
            <n-button
              quaternary
              circle
              size="tiny"
              :disabled="!canDecreaseBonus"
              aria-label="Уменьшить бонус инициативы"
              @click="adjustBonus(-1)"
            >
              <template #icon>
                <icon icon="tabler:minus" />
              </template>
            </n-button>

            <span class="participant-row__bonus-value">
              {{ formattedBonus }}
            </span>

            <n-button
              quaternary
              circle
              size="tiny"
              :disabled="!canIncreaseBonus"
              aria-label="Увеличить бонус инициативы"
              @click="adjustBonus(1)"
            >
              <template #icon>
                <icon icon="tabler:plus" />
              </template>
            </n-button>
          </template>

          <span v-else>{{ formattedBonus }}</span>
        </participant-stat-tile>

        <div
          class="participant-row__cell participant-row__cell--roll"
          :class="{ 'participant-row__avatar--dead': isDead }"
        >
          <participant-roll-control
            :participant="participant"
            :disabled="disabled"
            @roll="onRoll"
            @set-roll="onSetRoll"
          />
        </div>

        <n-dropdown
          trigger="click"
          :options="menuOptions"
          @select="onMenuSelect"
        >
          <n-button
            quaternary
            circle
            size="small"
            class="participant-row__menu"
            :disabled="disabled"
            aria-label="Ещё действия"
          >
            <template #icon>
              <icon icon="tabler:dots-vertical" />
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .participant-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;

    padding: 12px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    transition: border-color 0.15s ease-in-out;

    &--current {
      background-color: color-mix(in srgb, var(--primary) 10%, transparent);
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary);
    }

    &--dead-active {
      background-color: var(--bg-sub-menu);
      border-color: var(--border);
    }

    &--interactive {
      cursor: pointer;
    }

    &--interactive:not(.participant-row--current):hover {
      border-color: var(--border-hover);
    }

    &--locked {
      pointer-events: none;
      opacity: 0.6;
    }

    &__identity {
      display: flex;
      flex: 1 1 100%;
      gap: 12px;
      align-items: center;

      min-width: 0;

      @include media-min($sm) {
        flex: 1 1 auto;
      }
    }

    &__order {
      flex-shrink: 0;

      width: 20px;

      font-size: 14px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--text-g-color);
      text-align: center;
    }

    &__avatar--dead {
      opacity: 0.4;
      filter: grayscale(1);
    }

    &__names {
      flex: 1 1 auto;
      min-width: 0;
    }

    &__name-row {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    &__name {
      overflow: hidden;

      min-width: 0;

      font-weight: 600;
      color: var(--text-color-title);
      text-overflow: ellipsis;
      white-space: nowrap;

      &--dead {
        color: var(--text-g-color);
        text-decoration: line-through;
      }
    }

    &__rename {
      flex-shrink: 0;
    }

    &__subtitle {
      overflow: hidden;

      font-size: 12px;
      color: var(--text-g-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__stats {
      display: flex;
      flex: 1 1 100%;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;

      @include media-min($sm) {
        flex: 0 0 auto;
        flex-wrap: nowrap;
      }
    }

    &__group {
      display: flex;
      flex: 1 1 auto;
      gap: 8px;
      align-items: center;

      @include media-min($sm) {
        flex: 0 0 auto;
      }

      &--survival {
        min-width: 120px;
      }

      &--initiative {
        min-width: 212px;
      }
    }

    &__cell {
      flex: 1 1 auto;

      @include media-min($sm) {
        flex: 0 0 auto;
      }

      &--hp {
        width: 64px;
      }

      &--ac {
        width: 48px;
      }

      &--bonus {
        width: 96px;
      }

      &--roll {
        width: 64px;
      }
    }

    &__ac-tile {
      width: 100%;
    }

    &__dimmed {
      opacity: 0.5;
    }

    &__bonus-value {
      min-width: 28px;
      text-align: center;
    }

    &__menu {
      flex-shrink: 0;
    }
  }
</style>
