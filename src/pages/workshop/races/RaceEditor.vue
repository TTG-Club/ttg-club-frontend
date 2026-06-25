<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    RaceAbilitySave,
    RaceCreatureType,
    RaceSave,
    RaceSize,
    TRaceDetail,
    TRaceFeature,
    TRaceLink,
  } from '@/shared/types/character/Races';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      race?: TRaceDetail | null;
    }>(),
    {
      race: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const abilityOptions = [
    { label: 'Сила', value: 'STRENGTH' },
    { label: 'Ловкость', value: 'DEXTERITY' },
    { label: 'Телосложение', value: 'CONSTITUTION' },
    { label: 'Интеллект', value: 'INTELLIGENCE' },
    { label: 'Мудрость', value: 'WISDOM' },
    { label: 'Харизма', value: 'CHARISMA' },
    { label: 'К одной', value: 'ONE' },
    { label: 'К другой', value: 'CHOICE' },
    { label: 'К двум другим', value: 'CHOICE_UNIQUE' },
    { label: '+2 и +1 / +1 к трем', value: 'CHOICE_DOUBLE' },
  ];

  const sizeOptions: Array<{ label: string; value: RaceSize }> = [
    { label: 'Крошечный', value: 'TINY' },
    { label: 'Маленький', value: 'SMALL' },
    { label: 'Средний', value: 'MEDIUM' },
    { label: 'Большой', value: 'LARGE' },
    { label: 'Огромный', value: 'HUGE' },
    { label: 'Громадный', value: 'GARGANTUAN' },
    { label: 'Средний или маленький', value: 'SMALL_MEDIUM' },
  ];

  const typeOptions: Array<{ label: string; value: RaceCreatureType }> = [
    { label: 'Аберрация', value: 'ABERRATION' },
    { label: 'Зверь', value: 'BEAST' },
    { label: 'Небожитель', value: 'CELESTIAL' },
    { label: 'Конструкт', value: 'CONSTRUCT' },
    { label: 'Дракон', value: 'DRAGON' },
    { label: 'Элементаль', value: 'ELEMENTAL' },
    { label: 'Фея', value: 'FEY' },
    { label: 'Исчадие', value: 'FIEND' },
    { label: 'Великан', value: 'GIANT' },
    { label: 'Гуманоид', value: 'HUMANOID' },
    { label: 'Монстр', value: 'MONSTROSITY' },
    { label: 'Тина', value: 'OOZE' },
    { label: 'Потусторонний', value: 'OUTSIDER' },
    { label: 'Растение', value: 'PLANT' },
    { label: 'Демон', value: 'DEVIL' },
    { label: 'Нежить', value: 'UNDEAD' },
    { label: 'Паразит', value: 'VERMIN' },
    { label: 'Слизь', value: 'SLIME' },
    { label: 'Стая крошечных зверей', value: 'SMALL_BEAST' },
    { label: 'Рой', value: 'SWARM' },
  ];

  const createAbility = (): RaceAbilitySave => ({
    ability: 'STRENGTH',
    bonus: 1,
  });

  const createFeature = (): TRaceFeature => ({
    name: '',
    englishName: '',
    description: '',
    feature: true,
  });

  const optionalNumber = (value?: number) =>
    value === undefined || value === null ? undefined : value;

  const form = reactive<RaceSave>({
    name: props.race?.name.rus || '',
    altName: props.race?.altName || '',
    englishName: props.race?.name.eng || '',
    minAge: props.race?.minAge,
    maxAge: props.race?.maxAge,
    description: props.race?.description || '',
    parentId: props.race?.parentId,
    size: props.race?.sizeRaw || 'MEDIUM',
    type: props.race?.typeRaw || 'HUMANOID',
    darkvision: props.race?.darkvision,
    speed: props.race?.speed?.[0]?.value || 30,
    fly: props.race?.fly,
    climb: props.race?.climb,
    swim: props.race?.swim,
    origin: props.race?.origin ?? true,
    view: props.race?.view ?? true,
    icon: props.race?.icon || '',
    page: props.race?.page,
    abilities:
      props.race?.abilities?.map((ability) => ({
        id: ability.id,
        ability: ability.key,
        bonus: ability.value,
      })) || [],
    features:
      props.race?.features?.map((feature) => ({
        ...feature,
        englishName: feature.englishName || '',
      })) || [],
  });

  const pending = ref(false);
  const parentOptions = ref<Array<{ label: string; value: number }>>([]);
  const isEdit = computed(() => !!props.race?.id);

  const addAbility = () => {
    form.abilities.push(createAbility());
  };

  const removeAbility = (index: number) => {
    form.abilities.splice(index, 1);
  };

  const addFeature = () => {
    form.features.push(createFeature());
  };

  const removeFeature = (index: number) => {
    form.features.splice(index, 1);
  };

  const loadParents = async () => {
    try {
      const resp = await httpClient.post<TRaceLink[]>({
        url: '/races',
        payload: {},
      });

      parentOptions.value = resp.data
        .filter((race) => race.id !== props.race?.id)
        .map((race) => ({
          label: `${race.name.rus} (${race.name.eng})`,
          value: race.id as number,
        }))
        .filter((item) => item.value);
    } catch (err) {
      errorHandler(err);
    }
  };

  const submit = async () => {
    try {
      pending.value = true;

      const payload: RaceSave = {
        ...form,
        altName: form.altName || undefined,
        minAge: optionalNumber(form.minAge),
        maxAge: optionalNumber(form.maxAge),
        parentId: optionalNumber(form.parentId),
        darkvision: optionalNumber(form.darkvision),
        fly: optionalNumber(form.fly),
        climb: optionalNumber(form.climb),
        swim: optionalNumber(form.swim),
        icon: form.icon || undefined,
        page: optionalNumber(form.page),
        abilities: form.abilities.filter((ability) => ability.ability),
        features: form.features
          .filter(
            (feature) => feature.name.trim() && feature.description.trim(),
          )
          .map((feature) => ({
            ...feature,
            name: feature.name.trim(),
            englishName: feature.englishName?.trim() || undefined,
            description: feature.description.trim(),
            replaceFeatureId: optionalNumber(feature.replaceFeatureId),
          })),
      };

      const resp = isEdit.value
        ? await httpClient.patch<TRaceDetail>({
            url: `/workshop/races/${props.race?.id}`,
            payload,
          })
        : await httpClient.post<TRaceDetail>({
            url: '/workshop/races',
            payload,
          });

      message.success(isEdit.value ? 'Раса обновлена' : 'Раса создана');

      await router.push(
        `/workshop/races/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить расу');
    } finally {
      pending.value = false;
    }
  };

  onBeforeMount(loadParents);
</script>

<template>
  <form
    class="race-editor"
    @submit.prevent="submit"
  >
    <label class="race-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="race-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="race-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="race-editor__field">
      <span>Родительская раса</span>

      <n-select
        v-model:value="form.parentId"
        :options="parentOptions"
        clearable
        filterable
      />
    </label>

    <label class="race-editor__field">
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

    <label class="race-editor__field">
      <span>Тип существа</span>

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

    <label class="race-editor__field">
      <span>Минимальный возраст</span>

      <input
        v-model.number="form.minAge"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Максимальный возраст</span>

      <input
        v-model.number="form.maxAge"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Скорость</span>

      <input
        v-model.number="form.speed"
        min="0"
        required
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Тёмное зрение</span>

      <input
        v-model.number="form.darkvision"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Полёт</span>

      <input
        v-model.number="form.fly"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Лазание</span>

      <input
        v-model.number="form.climb"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Плавание</span>

      <input
        v-model.number="form.swim"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field">
      <span>Иконка</span>

      <input
        v-model="form.icon"
        type="text"
      />
    </label>

    <label class="race-editor__field">
      <span>Страница</span>

      <input
        v-model.number="form.page"
        min="0"
        type="number"
      />
    </label>

    <label class="race-editor__field race-editor__field--checkbox">
      <input
        v-model="form.origin"
        type="checkbox"
      />

      <span>Происхождение</span>
    </label>

    <label class="race-editor__field race-editor__field--checkbox">
      <input
        v-model="form.view"
        type="checkbox"
      />

      <span>Скрывать в списке как отдельную расу</span>
    </label>

    <section class="race-editor__block">
      <div class="race-editor__block-header">
        <h3>Бонусы характеристик</h3>

        <button
          type="button"
          @click="addAbility"
        >
          Добавить
        </button>
      </div>

      <article
        v-for="(ability, index) in form.abilities"
        :key="ability.id || index"
        class="race-editor__row"
      >
        <label class="race-editor__field">
          <span>Характеристика</span>

          <select v-model="ability.ability">
            <option
              v-for="item in abilityOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </label>

        <label class="race-editor__field race-editor__field--number">
          <span>Бонус</span>

          <input
            v-model.number="ability.bonus"
            type="number"
          />
        </label>

        <button
          class="race-editor__remove"
          type="button"
          @click="removeAbility(index)"
        >
          Удалить
        </button>
      </article>
    </section>

    <section class="race-editor__block">
      <div class="race-editor__block-header">
        <h3>Особенности</h3>

        <button
          type="button"
          @click="addFeature"
        >
          Добавить
        </button>
      </div>

      <article
        v-for="(feature, index) in form.features"
        :key="feature.id || index"
        class="race-editor__feature"
      >
        <button
          class="race-editor__feature-remove"
          type="button"
          @click="removeFeature(index)"
        >
          Удалить
        </button>

        <label class="race-editor__field">
          <span>Название</span>

          <input
            v-model="feature.name"
            type="text"
          />
        </label>

        <label class="race-editor__field">
          <span>Английское название</span>

          <input
            v-model="feature.englishName"
            type="text"
          />
        </label>

        <label class="race-editor__field race-editor__field--number">
          <span>Заменяет feature id</span>

          <input
            v-model.number="feature.replaceFeatureId"
            min="0"
            type="number"
          />
        </label>

        <label class="race-editor__field race-editor__field--checkbox">
          <input
            v-model="feature.feature"
            type="checkbox"
          />

          <span>Открывать по умолчанию</span>
        </label>

        <label class="race-editor__field race-editor__field--wide">
          <span>Описание</span>

          <textarea
            v-model="feature.description"
            rows="8"
          />
        </label>
      </article>
    </section>

    <label class="race-editor__field race-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="12"
      />
    </label>

    <div class="race-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/races">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .race-editor {
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

      &--checkbox {
        flex-direction: row;
        align-items: center;
      }

      &--number {
        max-width: 160px;
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

      input[type='checkbox'] {
        width: auto;
      }

      textarea {
        resize: vertical;
      }
    }

    &__block {
      display: flex;
      grid-column: 1 / -1;
      flex-direction: column;
      gap: 12px;

      padding: 16px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__block-header {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
      }
    }

    &__row,
    &__feature {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;

      padding: 12px;

      background-color: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__feature {
      position: relative;
      padding-right: 92px;
    }

    &__feature-remove {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    &__actions {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      padding-top: 8px;
    }

    button {
      cursor: pointer;

      min-height: 36px;
      padding: 6px 12px;

      color: var(--text-b-color);

      background-color: var(--primary);
      border: 0;
      border-radius: 8px;

      &:disabled {
        cursor: wait;
        opacity: 0.7;
      }
    }

    &__remove,
    &__feature-remove {
      align-self: end;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
    }

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      &__row,
      &__feature {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
</style>
