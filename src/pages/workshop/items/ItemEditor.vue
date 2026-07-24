<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useBookSources } from '@/shared/composable/useBookSources';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    EquipmentItem,
    EquipmentSave,
  } from '@/shared/types/inventory/Items';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      item?: EquipmentItem | null;
    }>(),
    {
      item: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const currencyOptions = ['MM', 'SM', 'EM', 'GM', 'PM'];

  const categoryOptions = [
    { label: 'Снаряжение', value: 'ADVENTURING_GEAR' },
    { label: 'Еда и напитки', value: 'EAT_DRINK' },
    { label: 'Инструменты', value: 'TOOL' },
    { label: 'Наборы', value: 'SET' },
    { label: 'Контейнеры', value: 'CONTAINER' },
    { label: 'Магическая фокусировка', value: 'FOCUSING' },
    { label: 'Фокусировка друидов', value: 'DRUID_FOCUS' },
    { label: 'Священный символ', value: 'HOLY_SYMBOL' },
    { label: 'Яды и противоядия', value: 'POISON' },
    { label: 'Одежда', value: 'CLOTHES' },
    { label: 'Игровой набор', value: 'GAME_SET' },
    { label: 'Инструменты ремесленников', value: 'ARTISANS_TOOLS' },
    { label: 'Муз. инструменты', value: 'MUSICAL_INSTRUMENTS' },
    { label: 'Бросаемое', value: 'THROWABLE' },
    { label: 'Освещение', value: 'LIGHT' },
    { label: 'Доспех', value: 'ARMOR' },
    { label: 'Лёгкий доспех', value: 'LIGHT_ARMOR' },
    { label: 'Средний доспех', value: 'MEDIUM_ARMOR' },
    { label: 'Тяжелый доспех', value: 'HEAVY_ARMOR' },
    { label: 'Оружие', value: 'WEAPON' },
    { label: 'Простое оружие', value: 'SIMPLE_WEAPON' },
    { label: 'Воинское оружие', value: 'MARTIAL_WEAPON' },
    { label: 'Экзотическое оружие', value: 'EXOTIC_WEAPON' },
    { label: 'Рукопашное оружие', value: 'MELE_WAPON' },
    { label: 'Дальнобойное оружие', value: 'RANGE_WAPON' },
    { label: 'Огнестрельное оружие', value: 'FIRE_WEAPON' },
    { label: 'Боеприпасы', value: 'AMMUNITION' },
    { label: 'Щит', value: 'SHIELD' },
    { label: 'Товары', value: 'TRADE_GOOD' },
    { label: 'Ездовое животное', value: 'MOUNT' },
    { label: 'Транспорт (водный)', value: 'VEHICLE_WATER' },
    { label: 'Транспорт (наземный)', value: 'VEHICLE_LAND' },
    { label: 'Транспорт (воздушный)', value: 'VEHICLE_AIR' },
    { label: 'Транспорт (космический)', value: 'VEHICLE_SPELLJAMMER' },
    { label: 'Осадное снаряжение', value: 'SIEGE_EQUIPMENT' },
  ];

  const { source, sourceOptions } = useBookSources(
    props.item?.source?.shortName,
  );

  const form = reactive<EquipmentSave>({
    name: props.item?.name.rus || '',
    englishName: props.item?.name.eng || '',
    altName: props.item?.altName || '',
    cost: props.item?.cost,
    currency: props.item?.currency || 'GM',
    weight: props.item?.weight || 0,
    description: props.item?.description || '',
    categories: props.item?.categoriesRaw || [],
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.item?.id);

  const optionalNumber = (value?: number) =>
    value === undefined || value === null ? undefined : value;

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        source: source.value || undefined,
        altName: form.altName || undefined,
        cost: optionalNumber(form.cost),
        weight: optionalNumber(form.weight),
        description: form.description || undefined,
      };

      const resp = isEdit.value
        ? await httpClient.patch<EquipmentItem>({
            url: `/workshop/items/${props.item?.id}`,
            payload,
          })
        : await httpClient.post<EquipmentItem>({
            url: '/workshop/items',
            payload,
          });

      message.success(
        isEdit.value ? 'Снаряжение обновлено' : 'Снаряжение создано',
      );

      await router.push(
        `/workshop/items/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить снаряжение');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="item-editor"
    @submit.prevent="submit"
  >
    <label class="item-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="item-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="item-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="item-editor__field">
      <span>Категории</span>

      <n-select
        v-model:value="form.categories"
        :options="categoryOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <label class="item-editor__field">
      <span>Цена</span>

      <input
        v-model.number="form.cost"
        min="0"
        type="number"
      />
    </label>

    <label class="item-editor__field">
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

    <label class="item-editor__field">
      <span>Вес</span>

      <input
        v-model.number="form.weight"
        min="0"
        step="0.1"
        type="number"
      />
    </label>

    <label class="item-editor__field item-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        rows="10"
      />
    </label>

    <label class="item-editor__field item-editor__field--wide">
      <span>Источник</span>

      <n-select
        v-model:value="source"
        :options="sourceOptions"
        clearable
        filterable
        placeholder="Homebrew (по умолчанию)"
      />
    </label>

    <div class="item-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/items">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .item-editor {
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
