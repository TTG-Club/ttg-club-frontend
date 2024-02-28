import { type RollBase } from 'dice-roller-parser';
import { h, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { ToastEventBus } from '@/core/configs/ToastConfig';

import { RollNotificationMode, useRollStore } from '@/shared/stores/RollStore';
import { eventBus, type Events } from '@/shared/utils/eventBus';
import { RollRenderer, isCritical, type RollType } from '@/shared/utils/roll';

const enabled = ref(false);

export function useDiceNotification() {
  const toast = useToast(ToastEventBus);

  const rollStore = useRollStore();

  function onNewRoll({
    entry: { roll, label, type },
    toastOptions,
  }: Events['Roll.New']) {
    if (rollStore.notificationMode !== RollNotificationMode.Notification) {
      return;
    }

    toast(
      getRendered({
        roll,
        label,
        type,
      }),
      {
        position: POSITION.BOTTOM_RIGHT,
        timeout: 5000,
        icon: false,
        ...toastOptions,
      },
    );
  }

  function enable() {
    if (enabled.value) {
      return;
    }

    enabled.value = true;
    eventBus.on('Roll.New', onNewRoll);
  }

  function disable() {
    if (!enabled.value) {
      return;
    }

    enabled.value = false;
    eventBus.off('Roll.New', onNewRoll);
  }

  return { enable, disable };
}

function getRendered({
  roll,
  label,
  type,
}: {
  roll: RollBase;
  label?: string;
  type?: RollType;
}) {
  if (!roll) {
    throw new Error('roll is not defined');
  }

  const rendered = h(
    'span',
    {
      class: 'dice-roll__rendered',
    },
    RollRenderer.render(roll),
  );

  return h(
    'span',
    {
      class: 'dice-roll',
    },
    [
      h(
        'strong',
        {
          class: {
            'dice-roll__result': true,
            'is-success': isCritical(roll, 'success'),
            'is-failure': isCritical(roll, 'failure'),
          },
        },
        Math.max(0, Math.floor(roll.value)),
      ),
      h(
        'span',
        {
          class: 'dice-roll__body',
        },
        label
          ? [
              h(
                'span',
                {
                  class: 'dice-roll__label',
                },
                `${label}${RollRenderer.getLabelSuffix(roll, type)}`,
              ),
              rendered,
            ]
          : rendered,
      ),
    ],
  );
}
