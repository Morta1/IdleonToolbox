import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

// slot 8 is the daily task, whose entry rotates; the page also hides the "To be revealed" stand-ins
const DAILY_SLOT = 8;
const MAX_RANK_ICON = 10;

export default {
  system: 'task',
  label: 'Tasks',
  entryLabel: 'task',
  scope: 'account',
  route: GOAL_ROUTES.task,
  list: ({ account }) => (account?.tasksDescriptions ?? []).flatMap((tasks, world) =>
    (tasks ?? [])
      .map((task, i) => ({ ...task, world, i }))
      .filter(({ i, name }) => i !== DAILY_SLOT && name !== 'Undisclosed_Task')),
  key: (row) => `${row.world}:${row.i}`,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/TaskRank${Math.min(MAX_RANK_ICON, row.level ?? 0)}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
