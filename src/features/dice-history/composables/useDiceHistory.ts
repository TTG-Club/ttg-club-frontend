import { RollNotificationMode, useRollStore } from '@/shared/stores/RollStore';

export function useDiceHistory() {
  const rollStore = useRollStore();

  const isOpen = computed(
    () => rollStore.notificationMode === RollNotificationMode.History,
  );

  function toggle() {
    rollStore.notificationMode = isOpen.value
      ? RollNotificationMode.Notification
      : RollNotificationMode.History;
  }

  return { isOpen, toggle };
}
