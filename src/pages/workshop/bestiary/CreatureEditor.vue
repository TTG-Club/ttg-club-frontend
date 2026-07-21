<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useBookSources } from '@/shared/composable/useBookSources';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    ICreature,
    ICreatureSave,
    ICreatureSaveDescription,
    ICreatureSaveNameValue,
  } from '@/shared/types/workshop/Bestiary';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      creature?: ICreature | null;
    }>(),
    {
      creature: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  type TextBlockField = 'feats' | 'actions' | 'bonusActions';

  type SkillEntry = {
    key: string;
    value: number | string;
    additional: string;
  };

  type EditableTextBlock = {
    name: string;
    englishName: string;
    description: string;
    markdown: boolean;
    sharedUsageCount?: number;
  };

  const option = (label: string, value: string) => ({ label, value });

  const sizeOptions = [
    option('Крошечный', 'TINY'),
    option('Маленький', 'SMALL'),
    option('Средний', 'MEDIUM'),
    option('Большой', 'LARGE'),
    option('Огромный', 'HUGE'),
    option('Громадный', 'GARGANTUAN'),
    option('Средний или маленький', 'SMALL_MEDIUM'),
  ];

  const typeOptions = [
    option('Аберрация', 'ABERRATION'),
    option('Зверь', 'BEAST'),
    option('Небожитель', 'CELESTIAL'),
    option('Конструкт', 'CONSTRUCT'),
    option('Дракон', 'DRAGON'),
    option('Элементаль', 'ELEMENTAL'),
    option('Фея', 'FEY'),
    option('Исчадие', 'FIEND'),
    option('Великан', 'GIANT'),
    option('Гуманоид', 'HUMANOID'),
    option('Монстр', 'MONSTROSITY'),
    option('Растение', 'PLANT'),
    option('Нежить', 'UNDEAD'),
    option('Слизь', 'SLIME'),
    option('Стая крошечных зверей', 'SMALL_BEAST'),
  ];

  const alignmentOptions = [
    option('Законно-добрый', 'LAWFUL_GOOD'),
    option('Законно-нейтральный', 'LAWFUL_NEUTRAL'),
    option('Законно-злой', 'LAWFUL_EVIL'),
    option('Нейтральный', 'TRUE_NEUTRAL'),
    option('Нейтрально-добрый', 'NEUTRAL_GOOD'),
    option('Нейтрально-злой', 'NEUTRAL_EVIL'),
    option('Хаотично-добрый', 'CHAOTIC_GOOD'),
    option('Хаотично-нейтральный', 'CHAOTIC_NEUTRAL'),
    option('Хаотично-злой', 'CHAOTIC_EVIL'),
    option('Без мировоззрения', 'WITHOUT'),
    option('Любое злое мировоззрение', 'ALL_EVIL'),
    option('Любое мировоззрение', 'ALL'),
    option('Любое не доброе мировоззрение', 'NO_GOOD'),
  ];

  const armorOptions = [
    option('природный доспех', 'NATURAL'),
    option('кожаный доспех', 'LEATHER'),
    option('шкурный доспех', 'HIDE'),
    option('кольчужная рубаха', 'CHAIN_SHIRT'),
    option('кольчатый доспех', 'RING_MAIL'),
    option('чешуйчатый доспех', 'SCALE_MAIL'),
    option('проклёпаная кожа', 'STUDDED_LEATHER'),
    option('кольчуга', 'CHAIN_MAIL'),
    option('кираса', 'BREASTPLATE'),
    option('полулаты', 'HALF_PLATE'),
    option('латный доспех', 'PLATE'),
    option('щит', 'SHIELD'),
  ];

  const damageOptions = [
    option('дробящий', 'BLUDGEONING'),
    option('колющий', 'PIERCING'),
    option('рубящий', 'SLASHING'),
    option('огонь', 'FAIR'),
    option('холод', 'COLD'),
    option('электричество', 'LIGHTNING'),
    option('яд', 'POISON'),
    option('кислота', 'ACID'),
    option('звук', 'SOUND'),
    option('некротическая энергия', 'NECTOTIC'),
    option('психическая энергия', 'PSYCHIC'),
    option('излучение', 'RADIANT'),
    option('силовое поле', 'FORCE'),
    option('физический', 'PHYSICAL'),
    option('физический и не посеребрённое', 'NO_NOSILVER'),
    option('физический и не адамантиновое', 'NO_ADMANTIT'),
    option('физический магический', 'PHYSICAL_MAGIC'),
    option('урон от заклинаний', 'MAGIC'),
  ];

  const conditionOptions = [
    option('ослепление', 'BLINDED'),
    option('очарование', 'CHARMED'),
    option('глухота', 'DEAFENED'),
    option('истощение', 'EXHAUSTION'),
    option('испуг', 'FRIGHTENED'),
    option('захват', 'GRAPPLED'),
    option('паралич', 'PARALYZED'),
    option('окаменение', 'PETRIFIED'),
    option('отравление', 'POISONED'),
    option('сбивание с ног', 'PRONE'),
    option('опутанность', 'RESTRAINED'),
    option('ошеломление', 'STUNNED'),
    option('бессознательность', 'UNCONSCIOUS'),
  ];

  const sizeHitDiceMap: Record<string, { dice: string; average: number }> = {
    TINY: { dice: 'd4', average: 2.5 },
    SMALL: { dice: 'd6', average: 3.5 },
    MEDIUM: { dice: 'd8', average: 4.5 },
    LARGE: { dice: 'd10', average: 5.5 },
    HUGE: { dice: 'd12', average: 6.5 },
    GARGANTUAN: { dice: 'd20', average: 10.5 },
    SMALL_MEDIUM: { dice: 'd8', average: 4.5 },
  };

  const environmentOptions = [
    option('полярная тундра', 'ARCTIC'),
    option('побережье', 'COAST'),
    option('под водой', 'WATERS'),
    option('равнина/луг', 'GRASSLAND'),
    option('подземье', 'UNDERGROUND'),
    option('город', 'CITY'),
    option('деревня', 'VILLAGE'),
    option('руины', 'RUINS'),
    option('подземелья', 'DUNGEON'),
    option('лес', 'FOREST'),
    option('холмы', 'HILL'),
    option('горы', 'MOUNTAIN'),
    option('болото', 'SWAMP'),
    option('пустыня', 'DESERT'),
    option('тропики', 'TROPICS'),
  ];

  const abilityMap: Record<string, string> = {
    Сила: 'STRENGTH',
    Сил: 'STRENGTH',
    Ловкость: 'DEXTERITY',
    Лов: 'DEXTERITY',
    Телосложение: 'CONSTITUTION',
    Тел: 'CONSTITUTION',
    Интеллект: 'INTELLIGENCE',
    Инт: 'INTELLIGENCE',
    Мудрость: 'WISDOM',
    Мдр: 'WISDOM',
    Харизма: 'CHARISMA',
    Хар: 'CHARISMA',
  };

  const skillMap: Record<string, string> = {
    'Атлетика': 'ATHLETICS',
    'Акробатика': 'ACROBATICS',
    'Ловкость рук': 'SLEIGHT_OF_HAND',
    'Скрытность': 'STEALTH',
    'Магия': 'ARCANA',
    'История': 'HISTORY',
    'Анализ': 'INVESTIGATION',
    'Природа': 'NATURE',
    'Религия': 'RELIGION',
    'Уход за животными': 'ANIMAL_HANDLING',
    'Проницательность': 'INSIGHT',
    'Медицина': 'MEDICINE',
    'Внимательность': 'PERCEPTION',
    'Выживание': 'SURVIVAL',
    'Обман': 'DECEPTION',
    'Запугивание': 'INTIMIDATION',
    'Выступление': 'PERFORMANCE',
    'Убеждение': 'PERSUASION',
  };

  const skillOptions = Object.entries(skillMap).map(([label, value]) =>
    option(label, value),
  );

  const selectedValues = (values?: string[], options = damageOptions) =>
    values
      ?.map(
        (value) =>
          options.find((item) => item.label === value || item.value === value)
            ?.value,
      )
      .filter((value): value is string => !!value) || [];

  const blockToText = (items?: Array<{ name: string; value?: string }>) =>
    items
      ?.map((item) => `${item.name}\n${item.value || ''}`.trim())
      .join('\n\n') || '';

  const toTextBlocks = (
    items?: Array<{
      name: string;
      englishName?: string;
      value?: string;
      markdown?: boolean;
      sharedUsageCount?: number;
    }>,
  ): EditableTextBlock[] =>
    items?.map((item) => ({
      name: item.name,
      englishName: item.englishName || '',
      description: item.value || '',
      markdown: item.markdown ?? true,
      sharedUsageCount: item.sharedUsageCount,
    })) || [];

  const createTextBlock = (): EditableTextBlock => ({
    name: '',
    englishName: '',
    description: '',
    markdown: true,
  });

  const parseBlocks = (value: string): ICreatureSaveDescription[] =>
    value
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const [name, ...description] = block.split('\n');

        return {
          name: {
            rus: name.trim(),
            eng: '',
          },
          description: description.join('\n').trim() || undefined,
        };
      });

  const parseLegendaryBlocks = (value: string): ICreatureSaveNameValue[] =>
    parseBlocks(value).map((block) => ({
      name: block.name.rus,
      value: block.description || '',
    }));

  const toDescriptionBlocks = (
    blocks: EditableTextBlock[],
  ): ICreatureSaveDescription[] =>
    blocks
      .filter(
        (block) =>
          block.name.trim() ||
          block.englishName.trim() ||
          block.description.trim(),
      )
      .map((block) => ({
        name: {
          rus: block.name.trim(),
          eng: block.englishName.trim(),
        },
        description: block.description.trim() || undefined,
        markdown: block.markdown,
      }));

  const findSpeed = (name?: string) =>
    props.creature?.speed.find((speed) => speed.name === name);

  const findSense = (name: string) =>
    props.creature?.senses.senses?.find((sense) => sense.name === name);

  const getEnumByLabel = (
    value: string | undefined,
    options: Array<{ label: string; value: string }>,
    fallback: string,
  ) =>
    options.find((item) => item.label.toLowerCase() === value?.toLowerCase())
      ?.value || fallback;

  const parseHitFormula = () => {
    const match = props.creature?.hits.formula?.match(/^(\d+)(?:d|к)(\d+)/);

    return {
      diceCount: match ? Number(match[1]) : undefined,
    };
  };

  const parsedHitFormula = parseHitFormula();

  const initialSkills = (): SkillEntry[] =>
    props.creature?.skills
      ?.map((skill) => ({
        key: skillMap[skill.name] || '',
        value: skill.value,
        additional: skill.additional || '',
      }))
      .filter((skill) => !!skill.key) || [];

  const form = reactive({
    name: props.creature?.name.rus || '',
    englishName: props.creature?.name.eng || '',
    altName: '',
    size: getEnumByLabel(props.creature?.size.rus, sizeOptions, 'MEDIUM'),
    type: getEnumByLabel(props.creature?.type.name, typeOptions, 'HUMANOID'),
    alignment: getEnumByLabel(
      props.creature?.alignment?.split('/')[0]?.trim(),
      alignmentOptions,
      'WITHOUT',
    ),
    armorClass: props.creature?.armorClass || 10,
    armorText: props.creature?.armorText || '',
    hitText: props.creature?.hits.text || '',
    armors: selectedValues(
      props.creature?.armors?.map((armor) => armor.name),
      armorOptions,
    ),
    diceCount: parsedHitFormula.diceCount,
    challengeRating: props.creature?.challengeRating || '0',
    npc: false,
    speed: Number(findSpeed()?.value || 30),
    flySpeed: findSpeed('летая')?.value || '',
    hover: findSpeed('летая')?.additional === 'парит',
    swimSpeed: findSpeed('плавая')?.value || '',
    climbSpeed: findSpeed('лазая')?.value || '',
    digSpeed: findSpeed('копая')?.value || '',
    str: props.creature?.ability.str || 10,
    dex: props.creature?.ability.dex || 10,
    con: props.creature?.ability.con || 10,
    int: props.creature?.ability.int || 10,
    wiz: props.creature?.ability.wiz || 10,
    cha: props.creature?.ability.cha || 10,
    skills: initialSkills(),
    passivePerception: props.creature?.senses.passivePerception || '10',
    darkvision: findSense('тёмное зрение')?.value || '',
    trysight: findSense('истинное зрение')?.value || '',
    blindsight: findSense('слепое зрение')?.value || '',
    blindsightRadius: !!findSense('слепое зрение')?.additional,
    vibration: findSense('чувство вибрации')?.value || '',
    languages: props.creature?.languages?.join(', ') || '',
    tags: props.creature?.tags?.map((tag) => tag.name).join(', ') || '',
    damageResistances: selectedValues(props.creature?.damageResistances),
    damageImmunities: selectedValues(props.creature?.damageImmunities),
    damageVulnerabilities: selectedValues(
      props.creature?.damageVulnerabilities,
    ),
    conditionImmunities: selectedValues(
      props.creature?.conditionImmunities,
      conditionOptions,
    ),
    environment: selectedValues(
      props.creature?.environment,
      environmentOptions,
    ),
    description: props.creature?.description || '',
    feats: toTextBlocks(props.creature?.feats),
    actions: toTextBlocks(props.creature?.actions),
    bonusActions: toTextBlocks(props.creature?.bonusActions),
    reactions: blockToText(props.creature?.reactions),
    reaction: props.creature?.reaction || '',
    legendaryDescription: props.creature?.legendary?.description || '',
    legendaryActions: blockToText(props.creature?.legendary?.list),
    mysticalActions: blockToText(props.creature?.mysticalActions),
  });

  const { source, sourceOptions } = useBookSources(
    props.creature?.source?.shortName,
  );

  const pending = ref(false);
  const isEdit = computed(() => !!props.creature?.id);

  const textBlockSections: Array<{ key: TextBlockField; title: string }> = [
    { key: 'feats', title: 'Особенности' },
    { key: 'actions', title: 'Действия' },
    { key: 'bonusActions', title: 'Бонусные действия' },
  ];

  const addTextBlock = (key: TextBlockField) => {
    form[key].push(createTextBlock());
  };

  const removeTextBlock = (key: TextBlockField, index: number) => {
    form[key].splice(index, 1);
  };

  const addSkill = () => {
    form.skills.push({ key: '', value: 0, additional: '' });
  };

  const removeSkill = (index: number) => {
    form.skills.splice(index, 1);
  };

  const hitDice = computed(
    () => sizeHitDiceMap[form.size] || sizeHitDiceMap.MEDIUM,
  );

  const constitutionModifier = computed(() =>
    Math.floor((Number(form.con) - 10) / 2),
  );

  const hitDiceBonus = computed(
    () => constitutionModifier.value * Number(form.diceCount || 0),
  );

  const averageHp = computed(() =>
    Math.floor(
      Number(form.diceCount || 0) * hitDice.value.average + hitDiceBonus.value,
    ),
  );

  const hitFormula = computed(() => {
    const diceCount = Number(form.diceCount || 0);

    if (!diceCount) {
      return '';
    }

    const bonus = hitDiceBonus.value;

    if (!bonus) {
      return `${diceCount}${hitDice.value.dice}`;
    }

    return `${diceCount}${hitDice.value.dice}${bonus > 0 ? '+' : '-'}${Math.abs(bonus)}`;
  });

  const csv = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const numberOrUndefined = (value: number | string | undefined) =>
    value === '' || value === undefined ? undefined : Number(value);

  const existingSavingThrows = (): ICreatureSaveNameValue[] =>
    props.creature?.savingThrows
      ?.map((save) => ({
        key: abilityMap[save.name] || abilityMap[save.shortName],
        name: save.name,
        shortName: save.shortName,
        value: save.value,
        additional: save.additional,
      }))
      .filter((save) => !!save.key) || [];

  const createPayload = (): ICreatureSave => {
    const speed: ICreatureSaveNameValue[] = [
      {
        value: Number(form.speed),
      },
    ];

    if (form.flySpeed) {
      speed.push({
        name: 'летая',
        value: Number(form.flySpeed),
        additional: form.hover ? 'парит' : undefined,
      });
    }

    if (form.swimSpeed) {
      speed.push({ name: 'плавая', value: Number(form.swimSpeed) });
    }

    if (form.climbSpeed) {
      speed.push({ name: 'лазая', value: Number(form.climbSpeed) });
    }

    if (form.digSpeed) {
      speed.push({ name: 'копая', value: Number(form.digSpeed) });
    }

    const senses: ICreatureSaveNameValue[] = [];

    if (form.darkvision) {
      senses.push({ name: 'тёмное зрение', value: Number(form.darkvision) });
    }

    if (form.trysight) {
      senses.push({ name: 'истинное зрение', value: Number(form.trysight) });
    }

    if (form.blindsight) {
      senses.push({
        name: 'слепое зрение',
        value: Number(form.blindsight),
        additional: form.blindsightRadius
          ? 'слеп за пределами этого радиуса'
          : undefined,
      });
    }

    if (form.vibration) {
      senses.push({ name: 'чувство вибрации', value: Number(form.vibration) });
    }

    return {
      id: props.creature?.id,
      name: {
        rus: form.name,
        eng: form.englishName,
        alt: form.altName || undefined,
      },
      size: form.size,
      type: form.type,
      alignment: form.alignment,
      armorClass: Number(form.armorClass),
      armorText: form.armorText || undefined,
      armors: form.armors,
      hits: {
        average: averageHp.value,
        diceCount: numberOrUndefined(form.diceCount),
        text: form.hitText || undefined,
      },
      speed,
      ability: {
        str: Number(form.str),
        dex: Number(form.dex),
        con: Number(form.con),
        int: Number(form.int),
        wiz: Number(form.wiz),
        cha: Number(form.cha),
      },
      savingThrows: existingSavingThrows(),
      skills: form.skills
        .filter((skill) => skill.key)
        .map((skill) => ({
          key: skill.key,
          value: Number(skill.value) || 0,
          additional: skill.additional || undefined,
        })),
      damageResistances: form.damageResistances,
      damageImmunities: form.damageImmunities,
      damageVulnerabilities: form.damageVulnerabilities,
      conditionImmunities: form.conditionImmunities,
      senses: {
        passivePerception: form.passivePerception,
        senses,
      },
      languages: csv(form.languages),
      challengeRating: form.challengeRating,
      feats: toDescriptionBlocks(form.feats),
      actions: toDescriptionBlocks(form.actions),
      reactions: parseBlocks(form.reactions),
      reaction: form.reaction || undefined,
      bonusActions: toDescriptionBlocks(form.bonusActions),
      legendary: {
        list: parseLegendaryBlocks(form.legendaryActions),
        count: 3,
        description: form.legendaryDescription || undefined,
      },
      mysticalActions: parseBlocks(form.mysticalActions),
      description: form.description || undefined,
      tags: csv(form.tags),
      environment: form.environment,
      npc: form.npc,
      source: source.value || undefined,
    };
  };

  const submit = async () => {
    try {
      pending.value = true;

      const payload = createPayload();

      const resp = isEdit.value
        ? await httpClient.put<ICreature>({
            url: '/bestiary',
            payload,
            version: 'v2',
          })
        : await httpClient.post<ICreature>({
            url: '/bestiary',
            payload,
            version: 'v2',
          });

      message.success(isEdit.value ? 'Существо обновлено' : 'Существо создано');

      await router.push(
        `/workshop/bestiary/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить существо');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="creature-editor"
    @submit.prevent="submit"
  >
    <label class="creature-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="creature-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="creature-editor__field">
      <span>Размер</span>

      <select
        v-model="form.size"
        required
      >
        <option
          v-for="item in sizeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="creature-editor__field">
      <span>Тип</span>

      <select
        v-model="form.type"
        required
      >
        <option
          v-for="item in typeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="creature-editor__field">
      <span>Мировоззрение</span>

      <select
        v-model="form.alignment"
        required
      >
        <option
          v-for="item in alignmentOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="creature-editor__field">
      <span>Источник</span>

      <n-select
        v-model:value="source"
        :options="sourceOptions"
        clearable
        filterable
        placeholder="Homebrew (по умолчанию)"
      />
    </label>

    <label class="creature-editor__field">
      <span>Уровень опасности</span>

      <input
        v-model="form.challengeRating"
        required
        type="text"
      />
    </label>

    <label class="creature-editor__field">
      <span>Класс доспеха</span>

      <input
        v-model.number="form.armorClass"
        min="0"
        required
        type="number"
      />
    </label>

    <label class="creature-editor__field">
      <span>Текст КД</span>

      <input
        v-model="form.armorText"
        type="text"
      />
    </label>

    <label class="creature-editor__field">
      <span>Доспехи</span>

      <n-select
        v-model:value="form.armors"
        :options="armorOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <div class="creature-editor__group">
      <label class="creature-editor__field">
        <span>Хиты: количество костей</span>

        <input
          v-model.number="form.diceCount"
          min="1"
          required
          type="number"
        />
      </label>

      <div class="creature-editor__readonly">
        <label class="creature-editor__field">
          <span>Среднее</span>

          <input
            :value="averageHp || '—'"
            readonly
            type="text"
          />
        </label>

        <label class="creature-editor__field">
          <span>Формула</span>

          <input
            :value="hitFormula || '—'"
            readonly
            type="text"
          />
        </label>
      </div>

      <label class="creature-editor__field">
        <span>Текст хитов</span>

        <input
          v-model="form.hitText"
          type="text"
        />
      </label>
    </div>

    <div class="creature-editor__group">
      <label class="creature-editor__field">
        <span>Скорость</span>

        <input
          v-model.number="form.speed"
          min="0"
          required
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Полёт</span>

        <input
          v-model.number="form.flySpeed"
          min="0"
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Плавание</span>

        <input
          v-model.number="form.swimSpeed"
          min="0"
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Лазание</span>

        <input
          v-model.number="form.climbSpeed"
          min="0"
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Копание</span>

        <input
          v-model.number="form.digSpeed"
          min="0"
          type="number"
        />
      </label>

      <n-checkbox v-model:checked="form.hover">Парит</n-checkbox>
    </div>

    <div class="creature-editor__group">
      <label
        v-for="ability in ['str', 'dex', 'con', 'int', 'wiz', 'cha']"
        :key="ability"
        class="creature-editor__field"
      >
        <span>{{ ability.toUpperCase() }}</span>

        <input
          v-model.number="form[ability]"
          max="30"
          min="1"
          required
          type="number"
        />
      </label>
    </div>

    <section class="creature-editor__text-section">
      <div class="creature-editor__text-section_header">
        <h3>Навыки</h3>

        <button
          type="button"
          @click="addSkill"
        >
          Добавить
        </button>
      </div>

      <div
        v-for="(skill, skillIndex) in form.skills"
        :key="skillIndex"
        class="creature-editor__skill-row"
      >
        <label class="creature-editor__field">
          <span>Навык</span>

          <select
            v-model="skill.key"
            required
          >
            <option
              disabled
              value=""
            >
              Выберите навык
            </option>

            <option
              v-for="item in skillOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </label>

        <label class="creature-editor__field">
          <span>Бонус</span>

          <input
            v-model.number="skill.value"
            required
            type="number"
          />
        </label>

        <label class="creature-editor__field">
          <span>Доп. текст</span>

          <input
            v-model="skill.additional"
            type="text"
          />
        </label>

        <button
          type="button"
          @click="removeSkill(skillIndex)"
        >
          Удалить
        </button>
      </div>

      <p
        v-if="!form.skills.length"
        class="creature-editor__empty"
      >
        Нет навыков.
      </p>
    </section>

    <div class="creature-editor__group">
      <label class="creature-editor__field">
        <span>Пассивная внимательность</span>

        <input
          v-model="form.passivePerception"
          type="text"
        />
      </label>

      <label class="creature-editor__field">
        <span>Тёмное зрение</span>

        <input
          v-model.number="form.darkvision"
          min="0"
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Истинное зрение</span>

        <input
          v-model.number="form.trysight"
          min="0"
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Слепое зрение</span>

        <input
          v-model.number="form.blindsight"
          min="0"
          type="number"
        />
      </label>

      <label class="creature-editor__field">
        <span>Чувство вибрации</span>

        <input
          v-model.number="form.vibration"
          min="0"
          type="number"
        />
      </label>

      <n-checkbox v-model:checked="form.blindsightRadius">
        Слеп за пределами радиуса
      </n-checkbox>
    </div>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Языки через запятую</span>

      <input
        v-model="form.languages"
        type="text"
      />
    </label>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Теги через запятую</span>

      <input
        v-model="form.tags"
        type="text"
      />
    </label>

    <div class="creature-editor__group creature-editor__group--wide">
      <label class="creature-editor__field">
        <span>Сопротивления</span>

        <n-select
          v-model:value="form.damageResistances"
          :options="damageOptions"
          clearable
          filterable
          multiple
        />
      </label>

      <label class="creature-editor__field">
        <span>Иммунитеты к урону</span>

        <n-select
          v-model:value="form.damageImmunities"
          :options="damageOptions"
          clearable
          filterable
          multiple
        />
      </label>

      <label class="creature-editor__field">
        <span>Уязвимости</span>

        <n-select
          v-model:value="form.damageVulnerabilities"
          :options="damageOptions"
          clearable
          filterable
          multiple
        />
      </label>

      <label class="creature-editor__field">
        <span>Иммунитеты к состояниям</span>

        <n-select
          v-model:value="form.conditionImmunities"
          :options="conditionOptions"
          clearable
          filterable
          multiple
        />
      </label>

      <label class="creature-editor__field">
        <span>Среда обитания</span>

        <n-select
          v-model:value="form.environment"
          :options="environmentOptions"
          clearable
          filterable
          multiple
        />
      </label>
    </div>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        rows="8"
      />
    </label>

    <section
      v-for="section in textBlockSections"
      :key="section.key"
      class="creature-editor__text-section"
    >
      <div class="creature-editor__text-section_header">
        <h3>{{ section.title }}</h3>

        <button
          type="button"
          @click="addTextBlock(section.key)"
        >
          Добавить
        </button>
      </div>

      <div
        v-for="(block, blockIndex) in form[section.key]"
        :key="blockIndex"
        class="creature-editor__text-block"
      >
        <div class="creature-editor__text-block_header">
          <strong>{{ section.title }} #{{ blockIndex + 1 }}</strong>

          <button
            type="button"
            @click="removeTextBlock(section.key, blockIndex)"
          >
            Удалить
          </button>
        </div>

        <p
          v-if="block.sharedUsageCount && block.sharedUsageCount > 1"
          class="creature-editor__text-block_warning"
        >
          Это действие используется несколькими существами:
          {{ block.sharedUsageCount }}.
        </p>

        <label class="creature-editor__field">
          <span>Название</span>

          <input
            v-model="block.name"
            type="text"
          />
        </label>

        <label class="creature-editor__field">
          <span>Английское название</span>

          <input
            v-model="block.englishName"
            type="text"
          />
        </label>

        <label class="creature-editor__field creature-editor__field--wide">
          <span>Описание</span>

          <textarea
            v-model="block.description"
            rows="6"
          />
        </label>

        <n-checkbox v-model:checked="block.markdown">
          Используется markdown
        </n-checkbox>
      </div>

      <p
        v-if="!form[section.key].length"
        class="creature-editor__empty"
      >
        Нет блоков.
      </p>
    </section>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Реакции</span>

      <textarea
        v-model="form.reactions"
        rows="5"
      />
    </label>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Свободный текст реакций</span>

      <textarea
        v-model="form.reaction"
        rows="4"
      />
    </label>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Описание легендарных действий</span>

      <textarea
        v-model="form.legendaryDescription"
        rows="4"
      />
    </label>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Легендарные действия</span>

      <textarea
        v-model="form.legendaryActions"
        rows="6"
      />
    </label>

    <label class="creature-editor__field creature-editor__field--wide">
      <span>Мистические действия</span>

      <textarea
        v-model="form.mysticalActions"
        rows="5"
      />
    </label>

    <div class="creature-editor__checks">
      <n-checkbox v-model:checked="form.npc">Именованный НИП</n-checkbox>
    </div>

    <div class="creature-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/bestiary">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .creature-editor {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 16px;

    &__field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &--wide {
        grid-column: 1 / -1;
      }

      span {
        color: var(--text-color);
      }

      input,
      select,
      textarea {
        width: 100%;
        padding: 10px 12px;

        color: var(--text-b-color);

        background-color: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 8px;
      }

      textarea {
        resize: vertical;
      }
    }

    &__group {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;
      align-items: end;

      &--wide {
        align-items: stretch;
      }
    }

    &__checks,
    &__actions {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
      gap: 12px;
    }

    &__text-section {
      display: flex;
      grid-column: 1 / -1;
      flex-direction: column;
      gap: 12px;

      padding: 16px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;

      &_header {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;

        h3 {
          margin: 0;
          font-size: var(--h4-font-size);
          line-height: var(--h4-line-height);
        }
      }
    }

    &__text-block {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;

      padding: 12px;

      background-color: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 8px;

      &_header {
        display: flex;
        grid-column: 1 / -1;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
      }

      &_warning {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--primary);
      }
    }

    &__empty {
      margin: 0;
      color: var(--text-color);
    }

    &__skill-row {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;
      align-items: end;

      padding: 12px;

      background-color: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__readonly {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;
    }

    &__actions {
      align-items: center;
      padding-top: 8px;

      button {
        cursor: pointer;

        min-height: 40px;
        padding: 8px 14px;

        color: var(--text-b-color);

        background-color: var(--primary);
        border: 0;
        border-radius: 8px;

        &:disabled {
          cursor: wait;
          opacity: 0.7;
        }
      }
    }

    &__text-section button,
    &__text-block button,
    &__skill-row button {
      cursor: pointer;

      min-height: 36px;
      padding: 6px 12px;

      color: var(--text-b-color);

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      &__group {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      &__text-block {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      &__skill-row {
        grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
      }

      &__readonly {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
</style>
