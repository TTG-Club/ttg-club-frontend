<script setup lang="ts">
  import { httpClient } from '@/shared/api';
  import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
  import type {
    BackgroundItem,
    BackgroundSave,
  } from '@/shared/types/character/Backgrounds';
  import { errorHandler } from '@/shared/utils/errorHandler';

  const props = withDefaults(
    defineProps<{
      background?: BackgroundItem | null;
    }>(),
    {
      background: null,
    },
  );

  const router = useRouter();
  const { message } = useDiscreteApi();

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

  const selectedSkills = () =>
    props.background?.skills
      ?.map(
        (skill) =>
          skillOptions.find(
            (item) => item.label === skill || item.value === skill,
          )?.value,
      )
      .filter((value): value is string => !!value) || [];

  const form = reactive<BackgroundSave>({
    name: props.background?.name.rus || '',
    englishName: props.background?.name.eng || '',
    skills: selectedSkills(),
    toolOwnership: props.background?.toolOwnership || '',
    equipments: props.background?.equipments?.join(', ') || '',
    startGold: props.background?.startGold || 0,
    description: props.background?.description || '',
    personalization: props.background?.personalization || '',
    languages: props.background?.languages || [],
  });

  const languageText = ref(form.languages.join(', '));
  const pending = ref(false);
  const isEdit = computed(() => !!props.background?.id);

  const csv = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const submit = async () => {
    try {
      pending.value = true;

      const payload = {
        ...form,
        altName: form.altName || undefined,
        otherSkills: form.otherSkills || undefined,
        toolOwnership: form.toolOwnership || undefined,
        equipments: form.equipments || undefined,
        personalization: form.personalization || undefined,
        language: form.language || undefined,
        languages: csv(languageText.value),
      };

      const resp = isEdit.value
        ? await httpClient.patch<BackgroundItem>({
            url: `/workshop/backgrounds/${props.background?.id}`,
            payload,
          })
        : await httpClient.post<BackgroundItem>({
            url: '/workshop/backgrounds',
            payload,
          });

      message.success(
        isEdit.value ? 'Предыстория обновлена' : 'Предыстория создана',
      );

      await router.push(
        `/workshop/backgrounds/${resp.data.name.eng.replace(/\s+/g, '_')}/edit`,
      );
    } catch (err) {
      errorHandler(err);
      message.error('Не удалось сохранить предысторию');
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <form
    class="background-editor"
    @submit.prevent="submit"
  >
    <label class="background-editor__field">
      <span>Название</span>

      <input
        v-model="form.name"
        required
        type="text"
      />
    </label>

    <label class="background-editor__field">
      <span>Английское название</span>

      <input
        v-model="form.englishName"
        required
        type="text"
      />
    </label>

    <label class="background-editor__field">
      <span>Навыки</span>

      <n-select
        v-model:value="form.skills"
        :options="skillOptions"
        clearable
        filterable
        multiple
      />
    </label>

    <label class="background-editor__field">
      <span>Другие навыки</span>

      <input
        v-model="form.otherSkills"
        type="text"
      />
    </label>

    <label class="background-editor__field">
      <span>Владение инструментами</span>

      <input
        v-model="form.toolOwnership"
        type="text"
      />
    </label>

    <label class="background-editor__field">
      <span>Стартовое золото</span>

      <input
        v-model.number="form.startGold"
        min="0"
        type="number"
      />
    </label>

    <label class="background-editor__field background-editor__field--wide">
      <span>Снаряжение через запятую</span>

      <input
        v-model="form.equipments"
        type="text"
      />
    </label>

    <label class="background-editor__field background-editor__field--wide">
      <span>Языки через запятую</span>

      <input
        v-model="languageText"
        type="text"
      />
    </label>

    <label class="background-editor__field background-editor__field--wide">
      <span>Описание</span>

      <textarea
        v-model="form.description"
        required
        rows="12"
      />
    </label>

    <label class="background-editor__field background-editor__field--wide">
      <span>Персонализация</span>

      <textarea
        v-model="form.personalization"
        rows="8"
      />
    </label>

    <div class="background-editor__actions">
      <button
        :disabled="pending"
        type="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>

      <router-link to="/workshop/backgrounds">Отмена</router-link>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .background-editor {
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
