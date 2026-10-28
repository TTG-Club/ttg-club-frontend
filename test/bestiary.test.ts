import type { CreatureDetail } from '~bestiary/model';

import { describe, expect, it } from 'vitest';

import {
  creatureDetailSchema,
  formatModifier,
  getAbilityScores,
  getArmorClassLabel,
  getChallengeRatingLabel,
  getCreatureActionGroups,
  getCreatureTypeLabel,
  getHitsFormula,
  getLanguagesLabel,
  getSavingThrowRolls,
  getSensesLabel,
  getSkillRolls,
  getSpeedLabel,
  joinCreatureList,
} from '~bestiary/model';

const creature: CreatureDetail = creatureDetailSchema.parse({
  name: { rus: 'Волк', eng: 'Wolf' },
  url: '/bestiary/Wolf',
  type: { name: 'зверь', tags: ['оборотень'] },
  challengeRating: '1/4',
  experience: 50,
  size: { rus: 'Средний', eng: 'medium', cell: '1 клетка' },
  alignment: 'без мировоззрения',
  armorClass: 13,
  armorText: 'природный доспех',
  hits: { average: 11, formula: '2к8', sign: ' + ', bonus: 2 },
  ability: { str: 12, dex: 15, con: 12, int: 3, wiz: 12, cha: 6 },
  actions: [{ name: 'Укус', value: '<p>Атака.</p>' }],
  legendary: { list: [{ name: 'Рык', value: '<p>Рычит.</p>' }] },
  lair: { action: '<p>Действие логова.</p>' },
});

describe('бестиарий', () => {
  it('модификаторы с типографским минусом', () => {
    expect(formatModifier(2)).toBe('+2');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-4)).toBe('−4');
  });

  it('характеристики с бросками', () => {
    const [str, , , int] = getAbilityScores(creature);

    expect(str).toMatchObject({ value: '12 (+1)', formula: '1к20+1' });
    expect(int).toMatchObject({ value: '3 (−4)', formula: '1к20−4' });
  });

  it('спасброски и навыки', () => {
    expect(
      getSavingThrowRolls([{ name: 'Ловкости', shortName: 'Лов', value: 5 }]),
    ).toEqual([
      {
        key: 'Лов',
        label: 'Лов',
        rollLabel: 'Спасбросок Ловкости',
        formula: 'к20+5',
        value: '+5',
      },
    ]);

    expect(
      getSkillRolls([{ name: 'Скрытность', value: 5, additional: ' (+1к4)' }]),
    ).toMatchObject([{ formula: 'к20+5', value: '+5 (+1к4)' }]);
  });

  it('перечисления и строки свойств', () => {
    expect(joinCreatureList(['яд', 'дробящий, колющий урон', 'холод'])).toBe(
      'яд; дробящий, колющий урон, холод',
    );

    expect(
      getSpeedLabel([
        { value: 40 },
        { name: 'летая', value: 60, additional: 'парит' },
      ]),
    ).toBe('40 фт., летая 60 фт. (парит)');

    expect(
      getSensesLabel({
        senses: {
          passivePerception: '13',
          senses: [{ name: 'тёмное зрение', value: 60 }],
        },
      }),
    ).toBe('тёмное зрение 60 фт., пассивная Внимательность 13');

    expect(getLanguagesLabel(creature)).toBe('—');
    expect(getArmorClassLabel(creature)).toBe('13 природный доспех');
    expect(getHitsFormula(creature.hits)).toBe('2к8 + 2');

    expect(getCreatureTypeLabel(creature)).toBe(
      'Средний зверь (оборотень), без мировоззрения / medium 1 клетка',
    );
  });

  it('уровень опасности с опытом', () => {
    expect(getChallengeRatingLabel(creature)).toBe('1/4 (50 опыта)');

    expect(
      getChallengeRatingLabel({ challengeRating: '0', experience: 0 }),
    ).toBe('0 (0 или 10 опыта)');

    expect(getChallengeRatingLabel({ challengeRating: '—' })).toBe('—');
  });

  it('блоки действий без пустых', () => {
    const groups = getCreatureActionGroups(creature);

    expect(groups.map((group) => group.key)).toEqual([
      'actions',
      'legendary',
      'lairActions',
    ]);

    expect(groups[1]?.text).toContain('Волк может совершить 3');
  });
});
