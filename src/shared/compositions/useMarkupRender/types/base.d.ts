export const SPEED: Array<{
  localized: string;
  key: string;
}> = [
  {
    localized: 'пешком',
    key: 'walk'
  },
  {
    localized: 'в полете',
    key: 'fly'
  },
  {
    localized: 'под землей',
    key: 'burrow'
  },
  {
    localized: 'при лазании',
    key: 'climb'
  },
  {
    localized: 'под водой',
    key: 'swim'
  }
];

export const CHALLENGE_RATING: { [key: string]: string } = {
  '-1': '—',
  '0': '0',
  '10': '0',
  '25': '1/8',
  '50': '1/4',
  '100': '1/2',
  '200': '1',
  '450': '2',
  '700': '3',
  '1100': '4',
  '1800': '5',
  '2300': '6',
  '2900': '7',
  '3900': '8',
  '5000': '9',
  '5900': '10',
  '7200': '11',
  '8400': '12',
  '10000': '13',
  '11500': '14',
  '13000': '15',
  '15000': '16',
  '18000': '17',
  '20000': '18',
  '22000': '19',
  '25000': '20',
  '33000': '21',
  '41000': '22',
  '50000': '23',
  '62000': '24',
  '75000': '25',
  '90000': '26',
  '105000': '27',
  '120000': '28',
  '135000': '29',
  '155000': '30'
};

export const DAMAGE_TYPE: Array<{
  key: string;
  localized: string;
}> = [
  {
    key: 'acid',
    localized: 'кислота'
  },
  {
    key: 'bludgeoning',
    localized: 'дробящий'
  },
  {
    key: 'cold',
    localized: 'холод'
  },
  {
    key: 'fire',
    localized: 'огонь'
  },
  {
    key: 'force',
    localized: 'силовое поле'
  },
  {
    key: 'lightning',
    localized: 'электричество'
  },
  {
    key: 'necrotic',
    localized: 'некротическая энергия'
  },
  {
    key: 'piercing',
    localized: 'колющий'
  },
  {
    key: 'poison',
    localized: 'яд'
  },
  {
    key: 'psychic',
    localized: 'психическая энергия'
  },
  {
    key: 'radiant',
    localized: 'излучение'
  },
  {
    key: 'slashing',
    localized: 'рубящий'
  },
  {
    key: 'thunder',
    localized: 'звук'
  }
];
