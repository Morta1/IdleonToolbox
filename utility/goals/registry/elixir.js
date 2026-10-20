import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'elixir',
  label: 'Spelunking elixirs',
  entryLabel: 'elixir',
  scope: 'account',
  route: GOAL_ROUTES.elixir,
  // one entry per catalog line, no filter: the position is the elixir id
  list: ({ account }) => withUniqueNames(
    (account?.spelunking?.elixirs ?? []).map((row, pos) => ({ ...row, pos })),
    // the page fills the "{" with the elixir's fixed bonus
    (row) => stableText(String(row.description ?? '').replace('{', row.bonus))
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `data/CaveElix${row.pos}`,
  metrics: {
    quantity: { label: 'Owned', value: (row) => row.quantity ?? 0 }
  }
};
