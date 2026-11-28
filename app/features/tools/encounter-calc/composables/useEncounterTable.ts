import type {
  EncounterCreatureOption,
  EncounterSelectItem,
  EncounterTableRoll,
  EncounterTableTier,
} from '../model';

import { consola } from 'consola';

import { BESTIARY_SECTION } from '~bestiary/model';
import {
  buildEncounterRequest,
  encounterOptionsSchema,
  encounterResultSchema,
  TOOLS_API_URL,
} from '~tools/model';

import {
  getTableCreatureApiUrl,
  parseTableCreature,
  rollTableCreatures,
  TABLE_ROLL_TEXT,
} from '../model';

/**
 * Бросок по таблицам случайных столкновений (раздел «Случайные
 * столкновения»): выпавших существ с брошенным количеством добавляет в
 * калькулятор, а саму строку таблицы показывает карточкой.
 * @param addCreature Добавляет существо в калькулятор.
 */
export function useEncounterTable(
  addCreature: (option: EncounterCreatureOption, count: number) => void,
) {
  const api = useApi();
  const toast = useToast();

  const tiers = shallowRef<Array<EncounterTableTier>>([]);
  const environments = shallowRef<Array<EncounterSelectItem>>([]);
  const lastRoll = ref<EncounterTableRoll>();
  const isRolling = ref(false);

  let rollId = 0;

  /** Грузит уровни и окружения таблиц. */
  async function loadOptions(): Promise<void> {
    const options = encounterOptionsSchema.parse(
      await api(TOOLS_API_URL.encounters),
    );

    tiers.value = options.levels.map(({ name, value }) => ({
      value,
      label: name,
    }));

    environments.value = options.environments.map(({ name, value }) => ({
      value,
      label: name,
    }));
  }

  /**
   * Находит существо из таблицы в бестиарии.
   * @param slug Часть адреса после `/bestiary/`.
   */
  async function fetchCreature(slug: string): Promise<EncounterCreatureOption> {
    return parseTableCreature(
      await api(getTableCreatureApiUrl(BESTIARY_SECTION.listUrl, slug), {
        method: 'POST',
      }),
    );
  }

  /**
   * Бросает по таблице и добавляет выпавших существ.
   * @param tier Диапазон уровней таблицы.
   * @param environment Окружение; пусто — случайное.
   */
  async function roll(
    tier: number | undefined,
    environment: string | undefined,
  ): Promise<void> {
    isRolling.value = true;

    try {
      const result = encounterResultSchema.parse(
        await api(TOOLS_API_URL.encounters, {
          method: 'POST',
          body: buildEncounterRequest(tier, environment),
        }),
      );

      const rolled = rollTableCreatures(result.description);

      const found = await Promise.allSettled(
        rolled.map(async ({ slug, count }) => ({
          option: await fetchCreature(slug),
          count,
        })),
      );

      const missing: Array<string> = [];

      let addedCount = 0;

      found.forEach((outcome, index) => {
        if (outcome.status === 'fulfilled') {
          addCreature(outcome.value.option, outcome.value.count);
          addedCount += outcome.value.count;

          return;
        }

        missing.push(rolled[index]?.slug ?? '');
      });

      rollId += 1;

      lastRoll.value = {
        id: rollId,
        tableName: result.tableName ?? undefined,
        sourceName: result.source?.name,
        description: result.description,
        addedCount,
      };

      if (!rolled.length) {
        toast.add({
          title: TABLE_ROLL_TEXT.noCreaturesTitle,
          description: TABLE_ROLL_TEXT.noCreaturesDescription,
          color: 'info',
          icon: 'tabler:info-circle',
        });
      }

      if (missing.length) {
        toast.add({
          title: TABLE_ROLL_TEXT.missingTitle,
          description: `${TABLE_ROLL_TEXT.missingDescription} ${missing.join(', ')}`,
          color: 'warning',
          icon: 'tabler:alert-triangle',
        });
      }
    } catch (error) {
      consola.error('Ошибка броска по таблице столкновений:', error);

      toast.add({
        title: TABLE_ROLL_TEXT.errorTitle,
        description: TABLE_ROLL_TEXT.errorDescription,
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isRolling.value = false;
    }
  }

  return {
    tiers,
    environments,
    lastRoll,
    isRolling,
    loadOptions,
    roll,
  };
}
