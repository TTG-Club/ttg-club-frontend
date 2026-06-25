<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    ClassAbility,
    ClassRest,
    ClassSave,
    ClassSkill,
    ClassSpellcasterType,
    ClassTrait,
    TClassItem,
  } from '@/shared/types/character/Classes';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      classItem?: TClassItem | null;
    }>(),
    {
      classItem: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const abilityOptions: Array<{ label: string; value: ClassAbility }> = [
    { label: 'Сила', value: 'STRENGTH' },
    { label: 'Ловкость', value: 'DEXTERITY' },
    { label: 'Телосложение', value: 'CONSTITUTION' },
    { label: 'Интеллект', value: 'INTELLIGENCE' },
    { label: 'Мудрость', value: 'WISDOM' },
    { label: 'Харизма', value: 'CHARISMA' },
  ];

  const skillOptions: Array<{ label: string; value: ClassSkill }> = [
    { label: 'Атлетика', value: 'ATHLETICS' },
    { label: 'Акробатика', value: 'ACROBATICS' },
    { label: 'Ловкость рук', value: 'SLEIGHT_OF_HAND' },
    { label: 'Скрытность', value: 'STEALTH' },
    { label: 'Магия', value: 'ARCANA' },
    { label: 'История', value: 'HISTORY' },
    { label: 'Анализ', value: 'INVESTIGATION' },
    { label: 'Природа', value: 'NATURE' },
    { label: 'Религия', value: 'RELIGION' },
    { label: 'Уход за животными', value: 'ANIMAL_HANDLING' },
    { label: 'Проницательность', value: 'INSIGHT' },
    { label: 'Медицина', value: 'MEDICINE' },
    { label: 'Внимательность', value: 'PERCEPTION' },
    { label: 'Выживание', value: 'SURVIVAL' },
    { label: 'Обман', value: 'DECEPTION' },
    { label: 'Запугивание', value: 'INTIMIDATION' },
    { label: 'Выступление', value: 'PERFORMANCE' },
    { label: 'Убеждение', value: 'PERSUASION' },
  ];

  const spellcasterOptions: Array<{
    label: string;
    value: ClassSpellcasterType;
  }> = [
    { label: 'Нет', value: 'NONE' },
    { label: 'Полный', value: 'FULL' },
    { label: 'Половинный', value: 'HALF' },
    { label: 'Частичный', value: 'PARTLY' },
  ];

  const restOptions: Array<{ label: string; value: ClassRest }> = [
    { label: 'Короткий отдых', value: 'SHORT' },
    { label: 'Продолжительный отдых', value: 'LONG' },
    { label: 'Полный отдых', value: 'FULL' },
  ];

  const optionTypeOptions = [
    { label: 'Нет', value: '' },
    { label: 'Боевые стили: Воин', value: 'FIGHTING_STYLE' },
    { label: 'Боевые стили: Следопыт', value: 'FIGHTING_STYLE_RANGER' },
    { label: 'Боевые стили: Паладин', value: 'FIGHTING_STYLE_PALADIN' },
    { label: 'Метамагия: Чародей', value: 'METAMAGIC' },
    { label: 'Воззвания: Колдун', value: 'ELDRITCH_INVOCATION' },
    { label: 'Договоры: Колдун', value: 'BONE' },
    { label: 'Формы Дикого Облика: Друид', value: 'WILD_SHAPE' },
    { label: 'Инфузии: Изобретатель', value: 'ARTIFICER_INFUSION' },
  ];

  const createClassTrait = (): ClassTrait => ({
    name: '',
    suffix: '',
    level: 1,
    description: '',
    optional: false,
    child: '',
  });

  const levelOptions = Array.from({ length: 20 }, (_, index) => index + 1);

  const form = reactive<ClassSave>({
    name: props.classItem?.name.rus || '',
    englishName: props.classItem?.name.eng || '',
    accusativeName: props.classItem?.accusativeName || '',
    description: props.classItem?.description || '',
    diceHp: props.classItem?.traits?.diceHp || 8,
    armor: props.classItem?.traits?.armor || '',
    weapon: props.classItem?.traits?.weapon || '',
    tools: props.classItem?.traits?.tools || '',
    savingThrows: props.classItem?.traits?.savingThrows || '',
    archetypeName: props.classItem?.archetypeName || '',
    equipment: props.classItem?.traits?.equipment || '',
    spellAbility: props.classItem?.spellAbility,
    spellcasterType: props.classItem?.spellcasterType || 'NONE',
    primaryAbilities: props.classItem?.primaryAbilities || [],
    enabledArhitypeLevel: props.classItem?.enabledArhitypeLevel || 0,
    skillAvailableCount: props.classItem?.traits?.skillAvailableCount || 0,
    availableSkills: props.classItem?.availableSkillsRaw || [],
    optionType: props.classItem?.optionType || '',
    slotsReset: props.classItem?.slotsReset,
    sidekick: !!props.classItem?.sidekick,
    icon: props.classItem?.icon || '',
    page: props.classItem?.page,
    classTraits:
      props.classItem?.classTraits?.map((trait) => ({
        ...trait,
        suffix: trait.suffix || '',
        child: trait.child || '',
      })) || [],
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.classItem?.id);

  const addClassTrait = () => {
    form.classTraits.push(createClassTrait());
  };

  const removeClassTrait = (index: number) => {
    form.classTraits.splice(index, 1);
  };

  const optionalNumber = (value?: number) =>
    value === undefined || value === null ? undefined : value;

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        accusativeName: form.accusativeName || undefined,
        armor: form.armor || undefined,
        weapon: form.weapon || undefined,
        tools: form.tools || undefined,
        savingThrows: form.savingThrows || undefined,
        archetypeName: form.archetypeName || undefined,
        equipment: form.equipment || undefined,
        spellAbility: form.spellAbility || undefined,
        optionType: form.optionType || undefined,
        slotsReset: form.slotsReset || undefined,
        icon: form.icon || undefined,
        page: optionalNumber(form.page),
        classTraits: form.classTraits
          .filter((trait) => trait.name.trim() && trait.description.trim())
          .map((trait) => ({
            ...trait,
            name: trait.name.trim(),
            suffix: trait.suffix?.trim() || undefined,
            description: trait.description.trim(),
            child: trait.child?.trim() || undefined,
          })),
      };

      const resp = isEdit.value
        ? await httpClient.patch<TClassItem>({
            url: `/workshop/classes/${props.classItem?.id}`,
            payload,
          })
        : await httpClient.post<TClassItem>({
            url: '/workshop/classes',
            payload,
          });

      message.success(isEdit.value ? 'Класс обновлён' : 'Класс создан');

      await router.push(
        `/workshop/classes/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить класс');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="class-editor"
    @submit.prevent="submit"
  >
    <label class="class-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="class-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="class-editor__field">
      <span>Название в винительном падеже</span>

      <input
        v-model="form.accusativeName"
        type="text"
      />
    </label>

    <label class="class-editor__field">
      <span>Кость хитов</span>

      <select
        v-model.number="form.diceHp"
        required
      >
        <option :value="6">d6</option>

        <option :value="8">d8</option>

        <option :value="10">d10</option>

        <option :value="12">d12</option>
      </select>
    </label>

    <label class="class-editor__field">
      <span>Основные характеристики</span>

      <n-select
        v-model:value="form.primaryAbilities"
        :options="abilityOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <label class="class-editor__field">
      <span>Спасброски</span>

      <input
        v-model="form.savingThrows"
        type="text"
      />
    </label>

    <label class="class-editor__field">
      <span>Доступно навыков</span>

      <input
        v-model.number="form.skillAvailableCount"
        min="0"
        type="number"
      />
    </label>

    <label class="class-editor__field">
      <span>Навыки на выбор</span>

      <n-select
        v-model:value="form.availableSkills"
        :options="skillOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <label class="class-editor__field">
      <span>Тип заклинателя</span>

      <select v-model="form.spellcasterType">
        <option
          v-for="item in spellcasterOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="class-editor__field">
      <span>Характеристика заклинаний</span>

      <select v-model="form.spellAbility">
        <option value="">Нет</option>

        <option
          v-for="item in abilityOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="class-editor__field">
      <span>Название архетипа</span>

      <input
        v-model="form.archetypeName"
        type="text"
      />
    </label>

    <label class="class-editor__field">
      <span>Уровень выбора архетипа</span>

      <input
        v-model.number="form.enabledArhitypeLevel"
        min="0"
        type="number"
      />
    </label>

    <label class="class-editor__field">
      <span>Опции класса</span>

      <select v-model="form.optionType">
        <option
          v-for="item in optionTypeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="class-editor__field">
      <span>Восстановление слотов</span>

      <select v-model="form.slotsReset">
        <option value="">Нет</option>

        <option
          v-for="item in restOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="class-editor__field">
      <span>Страница</span>

      <input
        v-model.number="form.page"
        min="0"
        type="number"
      />
    </label>

    <label class="class-editor__field class-editor__field--checkbox">
      <input
        v-model="form.sidekick"
        type="checkbox"
      />

      <span>Напарник</span>
    </label>

    <label class="class-editor__field class-editor__field--wide">
      <span>Доспехи</span>

      <textarea
        v-model="form.armor"
        rows="3"
      />
    </label>

    <label class="class-editor__field class-editor__field--wide">
      <span>Оружие</span>

      <textarea
        v-model="form.weapon"
        rows="3"
      />
    </label>

    <label class="class-editor__field class-editor__field--wide">
      <span>Инструменты</span>

      <textarea
        v-model="form.tools"
        rows="3"
      />
    </label>

    <label class="class-editor__field class-editor__field--wide">
      <span>Снаряжение</span>

      <textarea
        v-model="form.equipment"
        rows="6"
      />
    </label>

    <label class="class-editor__field class-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="12"
      />
    </label>

    <section class="class-editor__traits">
      <div class="class-editor__traits-header">
        <h3>Умения</h3>

        <button
          type="button"
          @click="addClassTrait"
        >
          Добавить
        </button>
      </div>

      <article
        v-for="(trait, index) in form.classTraits"
        :key="trait.id || index"
        class="class-editor__trait"
      >
        <button
          class="class-editor__trait-delete"
          type="button"
          @click="removeClassTrait(index)"
        >
          Удалить
        </button>

        <label class="class-editor__field class-editor__field--level">
          <span>Уровень</span>

          <select
            v-model.number="trait.level"
            required
          >
            <option
              v-for="level in levelOptions"
              :key="level"
              :value="level"
            >
              {{ level }}
            </option>
          </select>
        </label>

        <label class="class-editor__field">
          <span>Название</span>

          <input
            v-model="trait.name"
            type="text"
          />
        </label>

        <label class="class-editor__field">
          <span>Суффикс</span>

          <input
            v-model="trait.suffix"
            type="text"
          />
        </label>

        <label class="class-editor__field">
          <span>Дочерний якорь</span>

          <input
            v-model="trait.child"
            type="text"
          />
        </label>

        <label class="class-editor__field class-editor__field--wide">
          <span>Описание</span>

          <textarea
            v-model="trait.description"
            rows="8"
          />
        </label>

        <label class="class-editor__field class-editor__field--checkbox">
          <input
            v-model="trait.optional"
            type="checkbox"
          />

          <span>Опциональное умение</span>
        </label>
      </article>

      <p
        v-if="!form.classTraits.length"
        class="class-editor__empty"
      >
        Умения не добавлены.
      </p>
    </section>

    <div class="class-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/classes">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .class-editor {
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

      &--level {
        max-width: 120px;
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

    &__actions {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
      gap: 12px;
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

    &__traits {
      display: flex;
      grid-column: 1 / -1;
      flex-direction: column;
      gap: 12px;

      padding: 16px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__traits-header {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
      }

      button {
        cursor: pointer;

        min-height: 36px;
        padding: 6px 12px;

        color: var(--text-b-color);

        background-color: var(--primary);
        border: 0;
        border-radius: 8px;
      }
    }

    &__trait {
      position: relative;

      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;

      padding: 12px 92px 12px 12px;

      background-color: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__trait-delete {
      cursor: pointer;

      position: absolute;
      top: 12px;
      right: 12px;

      min-height: 36px;
      padding: 6px 12px;

      color: var(--text-b-color);

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__empty {
      margin: 0;
      color: var(--text-color);
    }

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      &__trait {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
</style>
