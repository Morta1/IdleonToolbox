import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

export default {
  system: 'equinoxChallenge',
  label: 'Equinox challenges',
  entryLabel: 'Equinox challenge',
  scope: 'account',
  route: GOAL_ROUTES.equinoxChallenge,
  // built 1:1 from the challenge catalog, so the position is the key
  list: ({ account }) => (account?.equinox?.challenges ?? []).map((challenge, index) => ({ ...challenge, index })),
  key: (row) => String(row.index),
  name: (row) => {
    const label = cleanText(row.label);
    return label.charAt(0).toUpperCase() + label.slice(1);
  },
  // the page draws no picture per challenge: the Equinox page's own icon
  icon: () => 'data/Quest78',
  metrics: {
    completed: {
      label: 'Completed',
      value: (row) => (row.current === -1 ? 1 : 0),
      boolean: true
    }
  }
};
