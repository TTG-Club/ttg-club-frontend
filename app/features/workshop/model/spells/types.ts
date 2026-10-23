/** Заклинание из справочника, как его открывает редактор. */
export interface WorkshopSpell {
  id: number;
  name: string;
  englishName: string;
  level: number;
  /** Название школы из карточки: «воплощение». */
  school: string;
  additionalType: string;
  ritual: boolean;
  concentration: boolean;
  verbal: boolean;
  somatic: boolean;
  /** Описание материального компонента; пусто, если его нет. */
  material: string;
  time: string;
  range: string;
  duration: string;
  description: string;
  upper: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}

/** Время накладывания, разобранное из карточки. */
export interface SpellTime {
  number: number;
  unit: string;
  condition: string;
}
