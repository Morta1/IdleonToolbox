import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

const rewards = (row) => (row.unlocks ?? []).filter((item) => item?.rawName);

export default {
  system: 'taskUnlock',
  label: 'Task unlocks',
  entryLabel: 'task unlock',
  scope: 'account',
  route: GOAL_ROUTES.taskUnlock,
  list: ({ account }) => (account?.taskUnlocks?.taskUnlocksList ?? []).flatMap((column, col) =>
    (column ?? []).map((unlock, i) => ({ ...unlock, col, i }))),
  key: (row) => `${row.col}:${row.i}`,
  name: (row) => {
    const label = rewards(row)
      .map(({ amount, displayName }) => `${amount > 0 ? `${amount} ` : ''}${cleanUnderscore(displayName ?? '')}`.trim())
      .join(', ');
    return label || `Unlock ${row.col + 1}-${row.i + 1}`;
  },
  // the page lists every reward of an unlock: the first one stands for it, the page's own icon when none
  icon: (row) => `data/${rewards(row)[0]?.rawName ?? 'PetLockB0'}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true }
  }
};
