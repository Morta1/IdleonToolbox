import { GOAL_ROUTES } from '../routes';

export default {
  system: 'menagerieMission',
  label: 'Menagerie missions',
  entryLabel: 'mission',
  scope: 'account',
  route: GOAL_ROUTES.menagerieMission,
  list: ({ account }) => account?.menagerie?.missions ?? [],
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `data/MenaIconY${row.index}`,
  metrics: {
    // the card's "Claimed n times"
    claims: { label: 'Times claimed', value: (row) => row.claims ?? 0 },
    // the card's "Progress: x / y": done once the progress covers the requirement of the next claim
    next: { label: 'Next claim', nextStep: true, value: (row) => row.progress ?? 0, threshold: (row) => row.requirement }
  }
};
