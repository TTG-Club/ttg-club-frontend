/** Запрос безумия: без вида бэкенд выбирает его сам. */
export interface MadnessRequest {
  count: number;
  type?: string;
}

/** Запрос дикой магии по выбранным книгам. */
export interface WildMagicRequest {
  count: number;
  sources: Array<string>;
}

/** Запрос столкновения: пустое поле бэкенд выбирает сам. */
export interface EncounterRequest {
  level?: number;
  environment?: string;
}

/** Результат генератора с ключом для списка. */
export interface ToolResult<T> {
  id: number;
  value: T;
}
