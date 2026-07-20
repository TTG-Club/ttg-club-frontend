<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useBookSources } from '@/shared/composable/useBookSources';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type { ArmorItem, ArmorSave } from '@/shared/types/inventory/Armors';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      armor?: ArmorItem | null;
    }>(),
    {
      armor: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

  const typeOptions = [
    { label: 'Лёгкий доспех', value: 'LIGHT' },
    { label: 'Средний доспех', value: 'MEDIUM' },
    { label: 'Тяжёлый доспех', value: 'HEAVY' },
    { label: 'Щит', value: 'SHIELD' },
  ];

  const { source, sourceOptions } = useBookSources(
    props.armor?.source?.shortName,
  );

  const form = reactive<ArmorSave>({
    name: props.armor?.name.rus || '',
    englishName: props.armor?.name.eng || '',
    armorClass: props.armor?.armorClassRaw || 10,
    cost: props.armor?.cost || 0,
    weight: props.armor?.weight || 0,
    forceRequirements: props.armor?.requirement,
    stealthHindrance: !!props.armor?.disadvantage,
    type: props.armor?.typeRaw || 'LIGHT',
    description: props.armor?.description || '',
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.armor?.id);

  const optionalNumber = (value?: number) =>
    value === undefined || value === null ? undefined : value;

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        source: source.value || undefined,
        altName: form.altName || undefined,
        armorClass: optionalNumber(form.armorClass),
        cost: optionalNumber(form.cost),
        weight: optionalNumber(form.weight),
        forceRequirements: optionalNumber(form.forceRequirements),
        description: form.description || undefined,
      };

      const resp = isEdit.value
        ? await httpClient.patch<ArmorItem>({
            url: `/workshop/armors/${props.armor?.id}`,
            payload,
          })
        : await httpClient.post<ArmorItem>({
            url: '/workshop/armors',
            payload,
          });

      message.success(isEdit.value ? 'Доспех обновлён' : 'Доспех создан');

      await router.push(
        `/workshop/armors/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить доспех');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="armor-editor"
    @submit.prevent="submit"
  >
    <label class="armor-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="armor-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="armor-editor__field">
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

    <label class="armor-editor__field">
      <span>КД</span>

      <input
        v-model.number="form.armorClass"
        min="0"
        required
        type="number"
      />
    </label>

    <label class="armor-editor__field">
      <span>Цена, зм</span>

      <input
        v-model.number="form.cost"
        min="0"
        type="number"
      />
    </label>

    <label class="armor-editor__field">
      <span>Вес</span>

      <input
        v-model.number="form.weight"
        min="0"
        step="0.1"
        type="number"
      />
    </label>

    <label class="armor-editor__field">
      <span>Требование силы</span>

      <input
        v-model.number="form.forceRequirements"
        min="0"
        type="number"
      />
    </label>

    <div class="armor-editor__checks">
      <n-checkbox v-model:checked="form.stealthHindrance">
        Помеха к Скрытности
      </n-checkbox>
    </div>

    <label class="armor-editor__field armor-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        rows="10"
      />
    </label>

    <label class="armor-editor__field armor-editor__field--wide">
      <span>Источник</span>

      <n-select
        v-model:value="source"
        :options="sourceOptions"
        clearable
        filterable
        placeholder="Homebrew (по умолчанию)"
      />
    </label>

    <div class="armor-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/armors">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .armor-editor {
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
