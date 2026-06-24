<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type { TSpellItem, TSpellSave } from '@/shared/types/character/Spells';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      spell?: TSpellItem | null;
    }>(),
    {
      spell: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const schoolOptions = [
    { label: 'Вызов', value: 'CONJURATION', detailValue: 'вызов' },
    { label: 'Воплощение', value: 'EVOCATION', detailValue: 'воплощение' },
    { label: 'Иллюзия', value: 'ILLUSION', detailValue: 'иллюзия' },
    { label: 'Некромантия', value: 'NECROMANCY', detailValue: 'некромантия' },
    { label: 'Ограждение', value: 'ABJURATION', detailValue: 'ограждение' },
    { label: 'Очарование', value: 'ENCHANTMENT', detailValue: 'очарование' },
    {
      label: 'Преобразование',
      value: 'TRANSMUTATION',
      detailValue: 'преобразование',
    },
    { label: 'Прорицание', value: 'DIVINATION', detailValue: 'прорицание' },
  ];

  const timeUnitOptions = [
    { label: 'Бонусное действие', value: 'BONUS' },
    { label: 'Реакция', value: 'REACTION' },
    { label: 'Действие', value: 'ACTION' },
    { label: 'Ход', value: 'ROUND' },
    { label: 'Минута', value: 'MINUTE' },
    { label: 'Час', value: 'HOUR' },
    { label: 'При попадании', value: 'ON_HIT' },
  ];

  const initialForm = (): TSpellSave => ({
    name: props.spell?.name.rus || '',
    englishName: props.spell?.name.eng || '',
    level: props.spell?.level || 0,
    school:
      schoolOptions.find((school) => school.detailValue === props.spell?.school)
        ?.value || 'EVOCATION',
    additionalType: props.spell?.additionalType || '',
    ritual: !!props.spell?.ritual,
    concentration: !!props.spell?.concentration,
    verbalComponent: !!props.spell?.components.v,
    somaticComponent: !!props.spell?.components.s,
    consumable: false,
    materialComponent: props.spell?.components.m || '',
    timeNumber: 1,
    timeUnit: 'ACTION',
    timeCondition: '',
    range: props.spell?.range || '',
    duration: props.spell?.duration || '',
    description: props.spell?.description || '',
    upper: props.spell?.upper || '',
  });

  const form = reactive<TSpellSave>(initialForm());
  const pending = ref(false);

  const isEdit = computed(() => !!props.spell?.id);

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        additionalType: form.additionalType || undefined,
        materialComponent: form.materialComponent || undefined,
        timeCondition: form.timeCondition || undefined,
        upper: form.upper || undefined,
      };

      const resp = isEdit.value
        ? await httpClient.patch<TSpellItem>({
            url: `/workshop/spells/${props.spell?.id}`,
            payload,
          })
        : await httpClient.post<TSpellItem>({
            url: '/workshop/spells',
            payload,
          });

      message.success(
        isEdit.value ? 'Заклинание обновлено' : 'Заклинание создано',
      );

      await router.push(
        `/workshop/spells/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить заклинание');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="spell-editor"
    @submit.prevent="submit"
  >
    <label class="spell-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="spell-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="spell-editor__field">
      <span>Уровень</span>

      <input
        v-model.number="form.level"
        max="9"
        min="0"
        required
        type="number"
      />
    </label>

    <label class="spell-editor__field">
      <span>Школа</span>

      <select
        v-model="form.school"
        required
      >
        <option
          v-for="school in schoolOptions"
          :key="school.value"
          :value="school.value"
        >
          {{ school.label }}
        </option>
      </select>
    </label>

    <label class="spell-editor__field">
      <span>Дополнительный тип</span>

      <input
        v-model="form.additionalType"
        type="text"
      />
    </label>

    <div class="spell-editor__checks">
      <label>
        <input
          v-model="form.ritual"
          type="checkbox"
        />
        Ритуал
      </label>

      <label>
        <input
          v-model="form.concentration"
          type="checkbox"
        />
        Концентрация
      </label>

      <label>
        <input
          v-model="form.verbalComponent"
          type="checkbox"
        />
        Вербальный
      </label>

      <label>
        <input
          v-model="form.somaticComponent"
          type="checkbox"
        />
        Соматический
      </label>

      <label>
        <input
          v-model="form.consumable"
          type="checkbox"
        />
        Расходуемый компонент
      </label>
    </div>

    <label class="spell-editor__field spell-editor__field--wide">
      <span>Материальный компонент</span>

      <input
        v-model="form.materialComponent"
        type="text"
      />
    </label>

    <label class="spell-editor__field">
      <span>Время: число</span>

      <input
        v-model.number="form.timeNumber"
        min="1"
        required
        type="number"
      />
    </label>

    <label class="spell-editor__field">
      <span>Время: единица</span>

      <select
        v-model="form.timeUnit"
        required
      >
        <option
          v-for="unit in timeUnitOptions"
          :key="unit.value"
          :value="unit.value"
        >
          {{ unit.label }}
        </option>
      </select>
    </label>

    <label class="spell-editor__field">
      <span>Условие времени</span>

      <input
        v-model="form.timeCondition"
        type="text"
      />
    </label>

    <label class="spell-editor__field">
      <span>Дистанция</span>

      <input
        v-model="form.range"
        required
        type="text"
      />
    </label>

    <label class="spell-editor__field">
      <span>Длительность</span>

      <input
        v-model="form.duration"
        required
        type="text"
      />
    </label>

    <label class="spell-editor__field spell-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="10"
      />
    </label>

    <label class="spell-editor__field spell-editor__field--wide">
      <span>На больших уровнях</span>

      <textarea
        v-model="form.upper"
        rows="5"
      />
    </label>

    <div class="spell-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/spells">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .spell-editor {
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

    &__checks,
    &__actions {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
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

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
