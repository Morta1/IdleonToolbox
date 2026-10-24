import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers } from './names';

export default {
  system: 'denAmplifier',
  label: 'Den amplifiers',
  entryLabel: 'amplifier',
  scope: 'account',
  route: GOAL_ROUTES.denAmplifier,
  list: ({ account }) => (account?.hole?.caverns?.theDen?.amplifiers ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => titleCaseTiers(row.ampName),
  icon: (row) => `data/HoleFightAmp${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
