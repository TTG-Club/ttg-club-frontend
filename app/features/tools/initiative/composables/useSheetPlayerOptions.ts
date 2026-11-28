import type {
  CharacterSheetList,
  SavedSheetList,
} from '~character-sheet/model';

import type { SheetPlayerOption } from '../model';

import { fetchSavedSheets, fetchSheetList } from '~character-sheet/model';

import { buildSheetPlayerOption } from '../model';

/**
 * Варианты из своих листов: в списке только активные, у каждого есть документ.
 * @param list - ответ списка своих листов
 */
function toOwnOptions(list: CharacterSheetList): Array<SheetPlayerOption> {
  return list.items.map((sheet) =>
    buildSheetPlayerOption(sheet.data, {
      sheetId: sheet.id,
      source: 'own',
      shareToken: null,
      savedId: null,
      name: sheet.name,
    }),
  );
}

/**
 * Варианты из сохранённых чужих листов: у недоступных (ссылку отозвали, лист
 * удалили) документа нет — собрать вариант не из чего.
 * @param list - ответ списка сохранённых листов
 */
function toSavedOptions(list: SavedSheetList): Array<SheetPlayerOption> {
  return list.items.flatMap((saved) =>
    saved.available && saved.data
      ? [
          buildSheetPlayerOption(saved.data, {
            sheetId: saved.sheetId,
            source: 'saved',
            shareToken: saved.shareToken,
            savedId: saved.id,
            name: saved.name,
          }),
        ]
      : [],
  );
}

/**
 * Листы персонажей, которых ведущий может поставить в бой: свои и сохранённые
 * чужие по ссылке. Оба списка грузятся параллельно и независимо: отказ одного
 * не прячет варианты другого, а вместе с уцелевшими показывается пометка об
 * ошибке. Гостю грузить нечего — листы есть только у вошедшего.
 */
export function useSheetPlayerOptions() {
  const { isLoggedIn } = useUser();

  const options = shallowRef<Array<SheetPlayerOption>>([]);
  const isLoading = ref(false);
  const hasError = ref(false);

  /** Загружает свои и сохранённые листы и собирает из них варианты. */
  async function load(): Promise<void> {
    if (!isLoggedIn.value || isLoading.value) {
      return;
    }

    isLoading.value = true;
    hasError.value = false;

    const [ownResult, savedResult] = await Promise.allSettled([
      fetchSheetList(),
      fetchSavedSheets(),
    ]);

    options.value = [
      ...(ownResult.status === 'fulfilled'
        ? toOwnOptions(ownResult.value)
        : []),
      ...(savedResult.status === 'fulfilled'
        ? toSavedOptions(savedResult.value)
        : []),
    ];

    hasError.value =
      ownResult.status === 'rejected' || savedResult.status === 'rejected';

    isLoading.value = false;
  }

  // Профиль приезжает уже после монтирования: загрузка по `onMounted`
  // застала бы «гостя», поэтому ждём сам вход. На сервере грузить нечего —
  // форма видна после гидратации.
  if (import.meta.client) {
    watch(
      isLoggedIn,
      (loggedIn) => {
        if (loggedIn) {
          void load();

          return;
        }

        options.value = [];
        hasError.value = false;
      },
      { immediate: true },
    );
  }

  return { options, isLoading, hasError, isLoggedIn, load };
}
