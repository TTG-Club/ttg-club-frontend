<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type { FeatSave, FeatsItem } from '@/shared/types/character/Feats';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      feat?: FeatsItem | null;
    }>(),
    {
      feat: null,
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
  ];

  const skillOptions = [
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

  const form = reactive<FeatSave>({
    name: props.feat?.name.rus || '',
    englishName: props.feat?.name.eng || '',
    requirement:
      props.feat?.requirements === 'Нет' ? '' : props.feat?.requirements || '',
    description: props.feat?.description || '',
    abilities: props.feat?.abilities || [],
    skills: props.feat?.skills || [],
  });

  const pending = ref(false);
  const isEdit = computed(() => !!props.feat?.id);

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        altName: form.altName || undefined,
        level: form.level || undefined,
        requirement: form.requirement || undefined,
      };

      const resp = isEdit.value
        ? await httpClient.patch<FeatsItem>({
            url: `/workshop/feats/${props.feat?.id}`,
            payload,
          })
        : await httpClient.post<FeatsItem>({
            url: '/workshop/feats',
            payload,
          });

      message.success(isEdit.value ? 'Черта обновлена' : 'Черта создана');

      await router.push(
        `/workshop/feats/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить черту');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="feat-editor"
    @submit.prevent="submit"
  >
    <label class="feat-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="feat-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="feat-editor__field">
      <span>Требования</span>

      <input
        v-model="form.requirement"
        type="text"
      />
    </label>

    <label class="feat-editor__field">
      <span>Уровень</span>

      <input
        v-model.number="form.level"
        min="1"
        type="number"
      />
    </label>

    <label class="feat-editor__field">
      <span>Характеристики</span>

      <select
        v-model="form.abilities"
        multiple
      >
        <option
          v-for="item in abilityOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="feat-editor__field">
      <span>Навыки</span>

      <select
        v-model="form.skills"
        multiple
      >
        <option
          v-for="item in skillOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="feat-editor__field feat-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="12"
      />
    </label>

    <div class="feat-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/feats">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .feat-editor {
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

      select[multiple] {
        min-height: 128px;
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
