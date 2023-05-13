import type {
  DiceExpressionRoll,
  DiceRollResult,
  DieRoll,
  ExpressionRoll,
  FateDieRoll,
  GroupRoll,
  MathFunctionRoll,
  RollBase
} from 'dice-roller-parser';
import { DiceRoller } from 'dice-roller-parser';
import type { VNode } from 'vue';
import { h } from 'vue';
import type { ToastOptions } from 'vue-toastification/dist/types/types';
import { POSITION, useToast } from 'vue-toastification';
import { ToastEventBus } from '@/common/utils/ToastConfig';

export function useDiceRoller() {
  const roller = new DiceRoller();
  const toast = useToast(ToastEventBus);

  /* eslint-disable @typescript-eslint/no-use-before-define */
  const doRender = (roll: RollBase): VNode => {
    let render;

    const { type } = roll;

    switch (type) {
      case 'diceexpressionroll':
        render = renderGroup(roll as DiceExpressionRoll);

        break;
      case 'grouproll':
        render = renderGroup(roll as GroupRoll);

        break;
      case 'die':
        render = renderDie(roll as DiceRollResult);

        break;
      case 'expressionroll':
        render = renderExpression(roll as ExpressionRoll);

        break;
      case 'mathfunction':
        render = renderFunction(roll as MathFunctionRoll);

        break;
      case 'roll':
        return renderRoll(roll as DieRoll);
      case 'fateroll':
        return renderFateRoll(roll as FateDieRoll);
      case 'number':
        return h(
          'span',
          `${ roll.value }${ roll.label
            ? ` (${ roll.label })`
            : '' }`
        );
      case 'fate':
        return h('span', 'F');
      default:
        throw new Error('Unable to render');
    }

    return h(
      !roll.valid ? 'u' : 'span',
      render
    );
  };

  const renderGroup = (group: GroupRoll | DiceExpressionRoll): VNode => {
    const replies: VNode[] = [];

    for (let i = 0; i < group.dice.length; i++) {
      const die = group.dice[0];

      replies.push(doRender(die));

      if (i < group.dice.length - 1) {
        replies.push(h('span', ' + '));
      }
    }

    return h(
      'span',
      replies
    );
  };

  const renderDie = (die: DiceRollResult): VNode => {
    const replies = [];

    for (let i = 0; i < die.rolls.length; i++) {
      const roll = die.rolls[i];

      replies.push(doRender(roll));

      if (i < die.rolls.length - 1) {
        replies.push(' + ');
      }
    }

    if (!['number', 'fate'].includes(die.die.type) || die.count.type !== 'number') {
      replies.push(h('span', [
        '[',
        h(
          'i',
          [
            'Rolling: ',
            doRender(die.count),
            'd',
            doRender(die.die)
          ]
        ),
        ']'
      ]));
    }

    return h('span', replies);
  };

  const renderExpression = (expr: ExpressionRoll): VNode => {
    if (expr.dice.length > 1) {
      const expressions = [];

      for (let i = 0; i < expr.dice.length - 1; i++) {
        expressions.push(doRender(expr.dice[i]));
        expressions.push(` ${ expr.ops[i] } `);
      }

      expressions.push(doRender(expr.dice.slice(-1)[0]));

      return h(
        'span',
        expressions
      );
    }

    if (expr.dice[0].type === 'number') {
      return h('span', expr.value);
    }

    return h('span', doRender(expr.dice[0]));
  };

  const renderFunction = (roll: MathFunctionRoll): VNode => h(
    'span',
    [roll.op, doRender(roll.expr)]
  );

  const renderRoll = (roll: DieRoll) => {
    let rollDisplay = h(
      'span',
      {
        class: {
          advantage: (roll.success && roll.value === 1) || (!roll.success && roll.critical === 'success'),
          disadvantage: (roll.success && roll.value === -1) || (!roll.success && roll.critical === 'failure')
        }
      },
      roll.roll
    );

    if (roll.matched) {
      rollDisplay = h('u', rollDisplay);
    }

    return h(
      !roll.valid ? 'del' : 'span',
      [
        '[',
        rollDisplay,
        ']'
      ]
    );
  };

  const renderFateRoll = (roll: FateDieRoll): VNode => {
    let rollDisplay: string | VNode = `${ roll.roll }`;

    if (roll.roll > 0) {
      rollDisplay = `+${ rollDisplay }`;
    }

    if (roll.roll < 0) {
      rollDisplay = `-${ rollDisplay }`;
    }

    rollDisplay = h(
      'span',
      {
        class: {
          advantage: roll.success && roll.value === 1,
          disadvantage: roll.success && roll.value === -1
        }
      },
      rollDisplay
    );

    if (roll.matched) {
      rollDisplay = h('u', rollDisplay);
    }

    return h(
      !roll.valid ? 'del' : 'span',
      [
        '[',
        rollDisplay,
        ']'
      ]
    );
  };
  /* eslint-enable @typescript-eslint/no-use-before-define */

  const isCritical = (
    roll: RollBase
      | DiceExpressionRoll
      | DiceRollResult
      | DieRoll
      | ExpressionRoll
      | FateDieRoll
      | GroupRoll
      | MathFunctionRoll,
    type: 'success' | 'failure'
  ) => {
    // @ts-ignore
    if (roll.dice?.[0] && roll.dice?.[0]?.die?.value === 20) {
      // @ts-ignore
      if (roll.dice[0].rolls.length <= 3) {
        // @ts-ignore
        for (const diceRoll of roll.dice[0].rolls) {
          if (diceRoll.critical === type && diceRoll.valid) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const getRendered = ({
    roll,
    label,
    type
  }: {
    roll: RollBase
    label?: string
    type?: 'advantage' | 'disadvantage'
  }): VNode => {
    if (!roll) {
      throw new Error('roll is not defined');
    }

    let labelSuffix = '';

    // @ts-ignore
    if (type && (roll.dice?.[0]?.die?.value === 20 || roll.die?.value === 20)) {
      labelSuffix = type === 'disadvantage' ? ' (помеха)' : ' (преимущество)';
    } else if (type) {
      labelSuffix = type === 'disadvantage' ? ' (1/2)' : ' (удвоенный бросок)';
    }

    const rendered = h(
      'span',
      {
        class: 'dice-roll__rendered'
      },
      doRender(roll)
    );

    return h(
      'span',
      {
        class: 'dice-roll'
      },
      [
        h(
          'strong',
          {
            class: {
              'dice-roll__result': true,
              'is-success': isCritical(roll, 'success'),
              'is-failure': isCritical(roll, 'failure')
            }
          },
          Math.max(0, Math.floor(roll.value))
        ),
        h(
          'span',
          {
            class: 'dice-roll__body'
          },
          label
            ? [
              h(
                'span',
                {
                  class: 'dice-roll__label'
                },
                `${ label }${ labelSuffix }`
              ),
              rendered
            ]
            : rendered
        )
      ]
    );
  };

  /**
   * Получение формулы броска
   *
   * @param formula - Формула броска.
   * @param type - Бросок с преимуществом или помехой
   */
  const getFormattedFormula = ({
    formula,
    type
  }: {
    formula: string
    type?: 'advantage' | 'disadvantage'
  }): string => {
    const formatted = formula
      .replace(/к/gim, 'd')
      .replace(/−/gim, '-');

    switch (type) {
      case 'advantage':
        if (formatted.startsWith('d20') || formatted.startsWith('1d20')) {
          return formatted
            .replace(/1?d20/gim, '2d20kh1');
        }

        return `${ formatted }+${ formatted.match(/[0-9]*d\d+/g) }`;
      case 'disadvantage':
        if (formatted.startsWith('d20') || formatted.startsWith('1d20')) {
          return formatted
            .replace(/1?d20/gim, '2d20kl1');
        }

        return `(${ formatted })/2`;

      default:
        return formatted;
    }
  };

  /**
   * Выполнение броска
   *
   * @param formula - Формула броска.
   * @param type - Бросок с преимуществом или помехой
   */
  const doRoll = ({
    formula,
    type
  }: {
    formula: string
    type?: 'advantage' | 'disadvantage'
  }): RollBase => roller.roll(getFormattedFormula({
    formula,
    type
  }));

  const notifyResult = ({
    roll,
    label,
    type,
    toastOptions
  }: {
    roll: RollBase
    label?: string
    type?: 'advantage' | 'disadvantage',
    toastOptions?: ToastOptions
  }) => {
    const toastOpts: ToastOptions = {
      position: POSITION.BOTTOM_RIGHT,
      timeout: 5000,
      icon: false,
      ...toastOptions
    };

    toast(getRendered({
      roll,
      label,
      type
    }), toastOpts);
  };

  return {
    roller,
    doRoll,
    getFormattedFormula,
    getRendered,
    notifyResult
  };
}

export default {
  useDiceRoller
};
