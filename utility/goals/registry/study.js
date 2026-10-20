import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'study',
  label: 'Studies',
  entryLabel: 'study',
  scope: 'account',
  route: GOAL_ROUTES.study,
  list: ({ account }) => (account?.hole?.studies?.studies ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.name),
  // the page draws no icon per study; the Studies villager stands for it
  icon: () => 'etc/Villager_4',
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
