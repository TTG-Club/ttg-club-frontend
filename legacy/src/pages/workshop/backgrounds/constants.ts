import type { BackgroundPersonalizationType } from '@/shared/types/character/Backgrounds';

import type { SelectOption } from 'naive-ui';

export const PERSONALIZATION_TYPE_OPTIONS: Array<
  SelectOption & { value: BackgroundPersonalizationType }
> = [
  { label: 'Жизнь в уединении', value: 'LIFE_IN_SECLUSION' },
  { label: 'Занятие', value: 'EMPLOYMENT' },
  { label: 'Специализация', value: 'SPECIALIZATION' },
  { label: 'Перенятая культура', value: 'ADOPTED_CULTURE' },
  { label: 'Ценные предметы', value: 'VALUABLE_ITEMS' },
  { label: 'Афера', value: 'SCAM' },
  { label: 'Амплуа', value: 'AMPLOIS' },
  { label: 'Определяющее событие', value: 'DEFINING_EVENT' },
  { label: 'Черта характера', value: 'TRAIT' },
  { label: 'Идеал', value: 'IDEAL' },
  { label: 'Привязанность', value: 'AFFECTION' },
  { label: 'Слабость', value: 'WEAKNESS' },
  { label: 'Зачем вы здесь?', value: 'WHY_ARE_YOU_HERE' },
  { label: 'Откуда вы?', value: 'WHERE_ARE_YOU_FROM' },
  { label: 'Наследие', value: 'HERITAGE' },
  { label: 'Обезображенный', value: 'DISFIGURED' },
  { label: 'Убеждение', value: 'CREED' },
  { label: 'Безделушка', value: 'BAUBLE' },
];
