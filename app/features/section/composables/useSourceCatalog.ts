import {
  parseSourceCatalog,
  SOURCE_CATALOG_KEY,
  SOURCE_CATALOG_PATH,
  SOURCE_CATALOG_QUERY,
} from '../model';

/**
 * Английские названия книг для панели источников: фильтры разделов отдают
 * книгу сокращением и русским названием. Список грузится только по `load`,
 * при первом открытии панели, и кэшируется по ключу — панели других
 * разделов его заново не тянут.
 */
export function useSourceCatalog() {
  const api = useApi();

  const {
    data: englishNames,
    status,
    execute,
  } = useAsyncData(
    SOURCE_CATALOG_KEY,
    async () =>
      parseSourceCatalog(
        await api<unknown>(SOURCE_CATALOG_PATH, {
          method: 'POST',
          body: SOURCE_CATALOG_QUERY,
        }),
      ),
    {
      server: false,
      immediate: false,
      deep: false,
      default: () => new Map<string, string>(),
    },
  );

  /** Загружает список, если его ещё не загрузили. */
  function load(): void {
    if (status.value === 'idle' || status.value === 'error') {
      execute();
    }
  }

  return { englishNames, load };
}
