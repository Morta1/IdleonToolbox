import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

export default {
  system: 'jar',
  label: 'Jars',
  entryLabel: 'jar',
  scope: 'account',
  route: GOAL_ROUTES.jar,
  list: ({ account }) => (account?.hole?.caverns?.theJars?.jars ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => stableText(row.name),
  icon: (row) => `etc/Jar_${row.index}`,
  metrics: {
    // the card's "Jars destroyed"
    destroyed: { label: 'Jars destroyed', value: (row) => row.destroyed ?? 0 }
  }
};
