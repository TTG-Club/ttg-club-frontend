<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    WeaponItem,
    WeaponSave,
  } from '@/shared/types/inventory/Weapons';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      weapon?: WeaponItem | null;
    }>(),
    {
      weapon: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const typeOptions = [
    { label: 'Простое рукопашное', value: 'SIMPLE_MELE' },
    { label: 'Простое дальнобойное', value: 'SIMPLE_RANGED' },
    { label: 'Воинское рукопашное', value: 'WAR_MELE' },
    { label: 'Воинское дальнобойное', value: 'WAR_RANGED' },
    { label: 'Экзотическое рукопашное', value: 'EXOTIC_MELE' },
    { label: 'Экзотическое дальнобойное', value: 'EXOTIC_RANGED' },
  ];

  const damageOptions = [
    { label: 'дробящий', value: 'BLUDGEONING' },
    { label: 'колющий', value: 'PIERCING' },
    { label: 'рубящий', value: 'SLASHING' },
    { label: 'без урона', value: 'NO_DAMAGE' },
  ];

  const diceOptions = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  const currencyOptions = ['MM', 'SM', 'EM', 'GM', 'PM'];

  const propertyOptions = [
    { label: 'Боеприпас', value: 1 },
    { label: 'Фехтовальное', value: 2 },
    { label: 'Тяжёлое', value: 3 },
    { label: 'Лёгкое', value: 4 },
    { label: 'Заряжаемое', value: 5 },
    { label: 'Двуручное', value: 6 },
    { label: 'Досягаемость', value: 7 },
    { label: 'Особое', value: 8 },
    { label: 'Метательное', value: 9 },
    { label: 'Универсальное', value: 10 },
  ];

  const form = reactive<WeaponSave>({
    name: props.weapon?.name.rus || '',
    englishName: props.weapon?.name.eng || '',
    cost: props.weapon?.cost,
    currency: props.weapon?.currency || 'GM',
    weight: props.weapon?.weight || 0,
    damageDice: props.weapon?.damageDice || 'd6',
    twoHandDamageDice: props.weapon?.twoHandDamageDice,
    numberDice: props.weapon?.numberDice || 1,
    damageType: props.weapon?.damageType || 'BLUDGEONING',
    type: props.weapon?.typeRaw || 'SIMPLE_MELE',
    minDistance: props.weapon?.minDistance,
    maxDistance: props.weapon?.maxDistance,
    properties: props.weapon?.propertyIds || [],
    ammo: props.weapon?.ammo,
    description: props.weapon?.description || '',
    special: props.weapon?.special || '',
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.weapon?.id);

  const optionalNumber = (value?: number) =>
    value === undefined || value === null ? undefined : value;

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        altName: form.altName || undefined,
        cost: optionalNumber(form.cost),
        weight: optionalNumber(form.weight),
        twoHandDamageDice: form.twoHandDamageDice || undefined,
        numberDice: optionalNumber(form.numberDice),
        minDistance: optionalNumber(form.minDistance),
        maxDistance: optionalNumber(form.maxDistance),
        ammo: optionalNumber(form.ammo),
        description: form.description || undefined,
        special: form.special || undefined,
      };

      const resp = isEdit.value
        ? await httpClient.patch<WeaponItem>({
            url: `/workshop/weapons/${props.weapon?.id}`,
            payload,
          })
        : await httpClient.post<WeaponItem>({
            url: '/workshop/weapons',
            payload,
          });

      message.success(isEdit.value ? 'Оружие обновлено' : 'Оружие создано');

      await router.push(
        `/workshop/weapons/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить оружие');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="weapon-editor"
    @submit.prevent="submit"
  >
    <label class="weapon-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="weapon-editor__field">
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

    <label class="weapon-editor__field">
      <span>Тип урона</span>

      <select
        v-model="form.damageType"
        required
      >
        <option
          v-for="item in damageOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="weapon-editor__field">
      <span>Количество костей</span>

      <input
        v-model.number="form.numberDice"
        min="1"
        type="number"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Кость урона</span>

      <select v-model="form.damageDice">
        <option
          v-for="dice in diceOptions"
          :key="dice"
          :value="dice"
        >
          {{ dice }}
        </option>
      </select>
    </label>

    <label class="weapon-editor__field">
      <span>Универсальная кость</span>

      <select v-model="form.twoHandDamageDice">
        <option value="">Нет</option>

        <option
          v-for="dice in diceOptions"
          :key="dice"
          :value="dice"
        >
          {{ dice }}
        </option>
      </select>
    </label>

    <label class="weapon-editor__field">
      <span>Цена</span>

      <input
        v-model.number="form.cost"
        min="0"
        type="number"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Валюта</span>

      <select v-model="form.currency">
        <option
          v-for="currency in currencyOptions"
          :key="currency"
          :value="currency"
        >
          {{ currency }}
        </option>
      </select>
    </label>

    <label class="weapon-editor__field">
      <span>Вес</span>

      <input
        v-model.number="form.weight"
        min="0"
        step="0.1"
        type="number"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Мин. дистанция</span>

      <input
        v-model.number="form.minDistance"
        min="0"
        type="number"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Макс. дистанция</span>

      <input
        v-model.number="form.maxDistance"
        min="0"
        type="number"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Боеприпасы</span>

      <input
        v-model.number="form.ammo"
        min="0"
        type="number"
      />
    </label>

    <label class="weapon-editor__field">
      <span>Свойства</span>

      <n-select
        v-model:value="form.properties"
        :options="propertyOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <label class="weapon-editor__field weapon-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        rows="8"
      />
    </label>

    <label class="weapon-editor__field weapon-editor__field--wide">
      <span>Особое</span>

      <textarea
        v-model="form.special"
        rows="5"
      />
    </label>

    <div class="weapon-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/weapons">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .weapon-editor {
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

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
