<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    MagicItemSave,
    TArtifactItem,
  } from '@/shared/types/inventory/MagicItems';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      magicItem?: TArtifactItem | null;
    }>(),
    {
      magicItem: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const rarityOptions = [
    { label: 'Обычный', value: 'COMMON' },
    { label: 'Необычный', value: 'UNCOMMON' },
    { label: 'Редкий', value: 'RARE' },
    { label: 'Очень редкий', value: 'VERY_RARE' },
    { label: 'Легендарный', value: 'LEGENDARY' },
    { label: 'Артефакт', value: 'ARTIFACT' },
    { label: 'Редкость не определена', value: 'UNKNOWN' },
    { label: 'Редкость варьируется', value: 'VARIES' },
  ];

  const typeOptions = [
    { label: 'Рукопашное оружие', value: 'MELE_WEAPON' },
    { label: 'Доспех', value: 'ARMOR' },
    { label: 'Волшебная палочка', value: 'WAND' },
    { label: 'Жезл', value: 'ROD' },
    { label: 'Посох', value: 'STAFF' },
    { label: 'Зелье', value: 'POTION' },
    { label: 'Кольцо', value: 'RING' },
    { label: 'Свиток', value: 'SCROLL' },
    { label: 'Чудесный предмет', value: 'SUBJECT' },
    { label: 'Дальнобойное оружие', value: 'RANGED_WEAPON' },
    { label: 'Щит', value: 'SHIELD' },
    { label: 'Аммуниция', value: 'AMMUNITION' },
    { label: 'Оружие', value: 'WEAPON' },
  ];

  const form = reactive<MagicItemSave>({
    name: props.magicItem?.name.rus || '',
    englishName: props.magicItem?.name.eng || '',
    altName: props.magicItem?.altName || '',
    rarity: props.magicItem?.rarityRaw || 'UNCOMMON',
    type: props.magicItem?.typeRaw || 'SUBJECT',
    customization: props.magicItem?.customization || false,
    custSpecial: props.magicItem?.custSpecial || '',
    special: props.magicItem?.specialRaw || '',
    description: props.magicItem?.description || '',
    consumed: props.magicItem?.consumed || false,
    charge: props.magicItem?.charge,
    curse: props.magicItem?.curse || false,
    cost: props.magicItem?.costRaw,
    bonus: props.magicItem?.bonus,
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.magicItem?.id);

  const optionalNumber = (value?: number) =>
    value === undefined || value === null ? undefined : value;

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        altName: form.altName || undefined,
        custSpecial: form.custSpecial || undefined,
        special: form.special || undefined,
        charge: optionalNumber(form.charge),
        cost: optionalNumber(form.cost),
        bonus: optionalNumber(form.bonus),
      };

      const resp = isEdit.value
        ? await httpClient.patch<TArtifactItem>({
            url: `/workshop/items/magic/${props.magicItem?.id}`,
            payload,
          })
        : await httpClient.post<TArtifactItem>({
            url: '/workshop/items/magic',
            payload,
          });

      message.success(
        isEdit.value
          ? 'Магический предмет обновлён'
          : 'Магический предмет создан',
      );

      await router.push(
        `/workshop/magic-items/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить магический предмет');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="magic-item-editor"
    @submit.prevent="submit"
  >
    <label class="magic-item-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="magic-item-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="magic-item-editor__field">
      <span>Альтернативное название</span>

      <input
        v-model="form.altName"
        type="text"
      />
    </label>

    <label class="magic-item-editor__field">
      <span>Редкость</span>

      <select
        v-model="form.rarity"
        required
      >
        <option
          v-for="item in rarityOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="magic-item-editor__field">
      <span>Тип предмета</span>

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

    <label class="magic-item-editor__field">
      <span>Заряды</span>

      <input
        v-model.number="form.charge"
        min="0"
        type="number"
      />
    </label>

    <label class="magic-item-editor__field">
      <span>Цена (зм)</span>

      <input
        v-model.number="form.cost"
        min="0"
        type="number"
      />
    </label>

    <label class="magic-item-editor__field">
      <span>Бонус</span>

      <input
        v-model.number="form.bonus"
        min="0"
        type="number"
      />
    </label>

    <div class="magic-item-editor__checks">
      <n-checkbox v-model:checked="form.customization">
        Требуется настройка
      </n-checkbox>

      <n-checkbox v-model:checked="form.consumed">
        Расходуемый при использовании
      </n-checkbox>

      <n-checkbox v-model:checked="form.curse"> Проклятие </n-checkbox>
    </div>

    <label class="magic-item-editor__field magic-item-editor__field--wide">
      <span>Условие настройки</span>

      <input
        v-model="form.custSpecial"
        type="text"
      />
    </label>

    <label class="magic-item-editor__field magic-item-editor__field--wide">
      <span>Уточнение типа</span>

      <input
        v-model="form.special"
        type="text"
      />
    </label>

    <label class="magic-item-editor__field magic-item-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="8"
      />
    </label>

    <div class="magic-item-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/magic-items">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .magic-item-editor {
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

    &__checks {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
      gap: 16px;
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
