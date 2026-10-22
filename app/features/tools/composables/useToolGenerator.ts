import type { ToolResult } from '../model';

import { TOOL_GENERATE_THROTTLE_MS, TOOLS_TEXT } from '../model';

/**
 * Результаты генератора: новые встают в начало списка, как в старом SPA.
 * Повторное нажатие отменяет незаконченный запрос.
 * @param request - запрос новых результатов; сигнал отменяет его
 */
export function useToolGenerator<T>(
  request: (signal: AbortSignal) => Promise<Array<T>>,
) {
  const toast = useToast();

  const results = shallowRef<Array<ToolResult<T>>>([]);
  const isPending = ref(false);

  let controller: AbortController | undefined;
  let nextId = 0;

  async function run(): Promise<void> {
    controller?.abort();

    const current = new AbortController();

    controller = current;
    isPending.value = true;

    try {
      const values = await request(current.signal);

      const added = values.map((value) => ({ id: nextId++, value })).reverse();

      results.value = [...added, ...results.value];
    } catch {
      if (!current.signal.aborted) {
        toast.add({ title: TOOLS_TEXT.error, color: 'error' });
      }
    } finally {
      if (controller === current) {
        controller = undefined;
        isPending.value = false;
      }
    }
  }

  const generate = useThrottleFn(run, TOOL_GENERATE_THROTTLE_MS);

  function clear(): void {
    results.value = [];
  }

  onScopeDispose(() => controller?.abort());

  return { results, isPending, generate, clear };
}
