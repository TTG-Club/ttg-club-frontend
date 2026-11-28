import type {
  CustomCreatureDraft,
  EncounterCreature,
  EncounterCreatureOption,
  EncounterPartyRow,
  EncounterResult,
  EncounterState,
} from '../model';

import {
  calculateEncounter,
  createBestiaryCreature,
  createCustomCreature,
  DEFAULT_CHARACTER_LEVEL,
  DEFAULT_ENCOUNTER_STATE,
  ENCOUNTER_STORAGE_KEY,
  findCustomCreature,
  MAX_CREATURE_ROWS,
  MAX_PARTY_ROWS,
  MAX_ROW_COUNT,
  MIN_ROW_COUNT,
  parseEncounterState,
} from '../model';

/**
 * Сериализатор состояния: пишем JSON, читаем через Zod-валидацию, чтобы
 * повреждённое значение из localStorage не сломало калькулятор.
 */
const stateSerializer = {
  /**
   * Читает состояние из строки хранилища.
   * @param raw Строка из localStorage.
   */
  read: (raw: string): EncounterState => {
    try {
      return parseEncounterState(JSON.parse(raw));
    } catch {
      return DEFAULT_ENCOUNTER_STATE;
    }
  },

  /**
   * Превращает состояние в строку для хранилища.
   * @param value Текущее состояние калькулятора.
   */
  write: (value: EncounterState): string => JSON.stringify(value),
};

/**
 * Прижимает количество к допустимому диапазону строки.
 * @param count Введённое количество.
 */
function clampCount(count: number): number {
  return Math.min(MAX_ROW_COUNT, Math.max(MIN_ROW_COUNT, Math.trunc(count)));
}

/**
 * Состояние калькулятора столкновений: группа, существа и итог расчёта.
 * Состояние хранится в localStorage и переживает перезагрузку страницы.
 */
export function useEncounterCalculator() {
  const state = useLocalStorage<EncounterState>(
    ENCOUNTER_STORAGE_KEY,
    DEFAULT_ENCOUNTER_STATE,
    { serializer: stateSerializer },
  );

  const party = computed(() => state.value.party);
  const creatures = computed(() => state.value.creatures);

  const result = computed<EncounterResult>(() =>
    calculateEncounter(state.value.party, state.value.creatures),
  );

  const canAddPartyRow = computed(
    () => state.value.party.length < MAX_PARTY_ROWS,
  );

  const canAddCreature = computed(
    () => state.value.creatures.length < MAX_CREATURE_ROWS,
  );

  /** Добавляет строку группы с уровнем последней строки. */
  function addPartyRow(): void {
    if (!canAddPartyRow.value) {
      return;
    }

    const lastLevel =
      state.value.party.at(-1)?.level ?? DEFAULT_CHARACTER_LEVEL;

    state.value = {
      ...state.value,
      party: [
        ...state.value.party,
        { id: crypto.randomUUID(), level: lastLevel, count: MIN_ROW_COUNT },
      ],
    };
  }

  /**
   * Меняет поля строки группы.
   * @param id Идентификатор строки.
   * @param patch Новые значения уровня и/или количества.
   */
  function updatePartyRow(
    id: string,
    patch: Partial<Pick<EncounterPartyRow, 'level' | 'count'>>,
  ): void {
    state.value = {
      ...state.value,
      party: state.value.party.map((row) =>
        row.id === id
          ? {
              ...row,
              ...patch,
              count: clampCount(patch.count ?? row.count),
            }
          : row,
      ),
    };
  }

  /**
   * Удаляет строку группы.
   * @param id Идентификатор строки.
   */
  function removePartyRow(id: string): void {
    state.value = {
      ...state.value,
      party: state.value.party.filter((row) => row.id !== id),
    };
  }

  /**
   * Меняет количество существа.
   * @param id Идентификатор строки.
   * @param count Новое количество.
   */
  function updateCreature(id: string, count: number): void {
    state.value = {
      ...state.value,
      creatures: state.value.creatures.map((creature) =>
        creature.id === id
          ? { ...creature, count: clampCount(count) }
          : creature,
      ),
    };
  }

  /**
   * Кладёт новую строку существа в конец списка.
   * @param creature Новая строка существа.
   */
  function appendCreature(creature: EncounterCreature): void {
    if (!canAddCreature.value) {
      return;
    }

    state.value = {
      ...state.value,
      creatures: [...state.value.creatures, creature],
    };
  }

  /**
   * Добавляет существо из бестиария. Если такое существо уже есть,
   * увеличивает его количество вместо новой строки.
   * @param option Существо из поиска или генератора.
   * @param count Сколько существ добавить.
   */
  function addCreature(option: EncounterCreatureOption, count: number): void {
    const existing = state.value.creatures.find(
      (creature) => creature.url === option.url,
    );

    if (existing) {
      updateCreature(existing.id, existing.count + count);

      return;
    }

    appendCreature(
      createBestiaryCreature(crypto.randomUUID(), option, clampCount(count)),
    );
  }

  /**
   * Добавляет своего монстра мастера. Если монстр с тем же названием и
   * уровнем опасности уже есть, увеличивает его количество.
   * @param draft Название, уровень опасности и количество.
   */
  function addCustomCreature(draft: CustomCreatureDraft): void {
    const existing = findCustomCreature(state.value.creatures, draft);

    if (existing) {
      updateCreature(existing.id, existing.count + draft.count);

      return;
    }

    appendCreature(
      createCustomCreature(crypto.randomUUID(), {
        ...draft,
        count: clampCount(draft.count),
      }),
    );
  }

  /**
   * Удаляет существо из столкновения.
   * @param id Идентификатор строки.
   */
  function removeCreature(id: string): void {
    state.value = {
      ...state.value,
      creatures: state.value.creatures.filter((creature) => creature.id !== id),
    };
  }

  /** Убирает всех существ, группу оставляет. */
  function clearCreatures(): void {
    state.value = { ...state.value, creatures: [] };
  }

  return {
    party,
    creatures,
    result,
    canAddPartyRow,
    canAddCreature,
    addPartyRow,
    updatePartyRow,
    removePartyRow,
    addCreature,
    addCustomCreature,
    updateCreature,
    removeCreature,
    clearCreatures,
  };
}
