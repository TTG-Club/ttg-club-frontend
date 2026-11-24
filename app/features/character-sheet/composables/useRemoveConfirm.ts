import { REMOVE_CONFIRM_TEXT } from '../model';

/** Удаление, ждущее подтверждения. */
interface PendingRemoval {
  name: string;
  run: () => void;
}

/**
 * Подтверждение удаления записи листа: предмета, заклинания, умения,
 * эффекта или заметки. Компонент показывает одно окно на все свои записи.
 */
export function useRemoveConfirm() {
  const pending = shallowRef<PendingRemoval | null>(null);

  const isOpen = computed({
    get: () => pending.value !== null,
    set: (open: boolean) => {
      if (!open) {
        pending.value = null;
      }
    },
  });

  const description = computed(() =>
    pending.value ? REMOVE_CONFIRM_TEXT.description(pending.value.name) : '',
  );

  /**
   * Спрашивает подтверждение.
   * @param name - название удаляемой записи
   * @param run - удаление
   */
  function ask(name: string, run: () => void): void {
    pending.value = { name: name.trim() || REMOVE_CONFIRM_TEXT.unnamed, run };
  }

  function confirm(): void {
    pending.value?.run();
    pending.value = null;
  }

  return {
    isOpen,
    title: REMOVE_CONFIRM_TEXT.title,
    description,
    ask,
    confirm,
  };
}
