import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
import { RollNotificationMode, useRollStore } from '@/shared/stores/RollStore';

export function useDiceHistory() {
  const rollStore = useRollStore();

  const { smaller, greaterOrEqual } = useAppBreakpoints();

  const isOpen = computed(
    () => rollStore.notificationMode === RollNotificationMode.History,
  );

  const isNavButtonVisible = smaller('md');

  const isFloatButtonVisible = greaterOrEqual('md');

  function toggle() {
    rollStore.notificationMode = isOpen.value
      ? RollNotificationMode.Notification
      : RollNotificationMode.History;
  }

  return { isNavButtonVisible, isFloatButtonVisible, isOpen, toggle };
}
