import { h, type VNode } from 'vue';

import type {
  DiceExpressionRoll,
  DiceRollResult,
  DieRoll,
  ExpressionRoll,
  FateDieRoll,
  GroupRoll,
  MathFunctionRoll,
  RollBase,
} from 'dice-roller-parser';

export type RollType = 'advantage' | 'disadvantage';

export class DiceRollRenderer {
  public static render(roll: RollBase): VNode {
    let render;

    const { type } = roll;

    switch (type) {
      case 'diceexpressionroll':
        render = this.renderGroup(roll as DiceExpressionRoll);

        break;
      case 'grouproll':
        render = this.renderGroup(roll as GroupRoll);

        break;
      case 'die':
        render = this.renderDie(roll as DiceRollResult);

        break;
      case 'expressionroll':
        render = this.renderExpression(roll as ExpressionRoll);

        break;
      case 'mathfunction':
        render = this.renderFunction(roll as MathFunctionRoll);

        break;
      case 'roll':
        return this.renderRoll(roll as DieRoll);
      case 'fateroll':
        return this.renderFateRoll(roll as FateDieRoll);
      case 'number':
        return h(
          'span',
          `${roll.value}${roll.label ? ` (${roll.label})` : ''}`,
        );
      case 'fate':
        return h('span', 'F');
      default:
        throw new Error('Unable to render');
    }

    return h(!roll.valid ? 'u' : 'span', render);
  }

  public static getLabelSuffix(roll: RollBase, type?: RollType) {
    // @ts-expect-error
    if (type && (roll.dice?.[0]?.die?.value === 20 || roll.die?.value === 20)) {
      return type === 'disadvantage' ? ' (помеха)' : ' (преимущество)';
    }

    if (type) {
      return type === 'disadvantage' ? ' (1/2)' : ' (удвоенный бросок)';
    }

    return '';
  }

  private static renderDie(die: DiceRollResult): VNode {
    const replies = [];

    for (let i = 0; i < die.rolls.length; i++) {
      const roll = die.rolls[i];

      replies.push(this.render(roll));

      if (i < die.rolls.length - 1) {
        replies.push(' + ');
      }
    }

    if (
      !['number', 'fate'].includes(die.die.type) ||
      die.count.type !== 'number'
    ) {
      replies.push(
        h('span', [
          '[',
          h('i', [
            'Rolling: ',
            this.render(die.count),
            'd',
            this.render(die.die),
          ]),
          ']',
        ]),
      );
    }

    return h('span', replies);
  }

  private static renderGroup(group: GroupRoll | DiceExpressionRoll) {
    const replies: VNode[] = [];

    for (let i = 0; i < group.dice.length; i++) {
      const die = group.dice[0];

      replies.push(this.render(die));

      if (i < group.dice.length - 1) {
        replies.push(h('span', ' + '));
      }
    }

    return h('span', replies);
  }

  private static renderExpression(expr: ExpressionRoll) {
    if (expr.dice.length > 1) {
      const expressions = [];

      for (let i = 0; i < expr.dice.length - 1; i++) {
        expressions.push(this.render(expr.dice[i]));
        expressions.push(` ${expr.ops[i]} `);
      }

      expressions.push(this.render(expr.dice.slice(-1)[0]));

      return h('span', expressions);
    }

    if (expr.dice[0].type === 'number') {
      return h('span', expr.value);
    }

    return h('span', this.render(expr.dice[0]));
  }

  private static renderFunction(roll: MathFunctionRoll) {
    return h('span', [roll.op, this.render(roll.expr)]);
  }

  private static renderRoll(roll: DieRoll) {
    let rollDisplay = h(
      'span',
      {
        class: {
          advantage:
            (roll.success && roll.value === 1) ||
            (!roll.success && roll.critical === 'success'),
          disadvantage:
            (roll.success && roll.value === -1) ||
            (!roll.success && roll.critical === 'failure'),
        },
      },
      roll.roll,
    );

    if (roll.matched) {
      rollDisplay = h('u', rollDisplay);
    }

    return h(!roll.valid ? 'del' : 'span', ['[', rollDisplay, ']']);
  }

  private static renderFateRoll(roll: FateDieRoll) {
    let rollDisplay: string | VNode = `${roll.roll}`;

    if (roll.roll > 0) {
      rollDisplay = `+${rollDisplay}`;
    }

    if (roll.roll < 0) {
      rollDisplay = `-${rollDisplay}`;
    }

    rollDisplay = h(
      'span',
      {
        class: {
          advantage: roll.success && roll.value === 1,
          disadvantage: roll.success && roll.value === -1,
        },
      },
      rollDisplay,
    );

    if (roll.matched) {
      rollDisplay = h('u', rollDisplay);
    }

    return h(!roll.valid ? 'del' : 'span', ['[', rollDisplay, ']']);
  }
}

/**
 * Получение формулы броска
 *
 * @param formula - Формула броска.
 * @param type - Бросок с преимуществом или помехой
 */
export function getFormattedFormula({
  formula,
  type,
}: {
  formula: string;
  type?: RollType;
}): string {
  const formatted = formula.replace(/к/gim, 'd').replace(/−/gim, '-');

  switch (type) {
    case 'advantage':
      if (formatted.startsWith('d20') || formatted.startsWith('1d20')) {
        return formatted.replace(/1?d20/gim, '2d20kh1');
      }

      return `${formatted}+${formatted.match(/[0-9]*d\d+/g)}`;
    case 'disadvantage':
      if (formatted.startsWith('d20') || formatted.startsWith('1d20')) {
        return formatted.replace(/1?d20/gim, '2d20kl1');
      }

      return `(${formatted})/2`;

    default:
      return formatted;
  }
}

export function isCritical(roll: RollBase, type: 'success' | 'failure') {
  // @ts-expect-error
  if (roll.dice?.[0] && roll.dice?.[0]?.die?.value === 20) {
    // @ts-expect-error
    if (roll.dice[0].rolls.length <= 3) {
      // @ts-expect-error
      for (const diceRoll of roll.dice[0].rolls) {
        if (diceRoll.critical === type && diceRoll.valid) {
          return true;
        }
      }
    }
  }

  return false;
}
