import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'highscore',
  label: 'Highscores',
  entryLabel: 'highscore',
  scope: 'account',
  route: GOAL_ROUTES.highscore,
  groups: {
    label: 'Type',
    of: (row) => row.type,
    names: { colo: 'Colosseum', minigame: 'Minigames' }
  },
  // the General page leaderboard tables; the colosseum or minigame name is the key
  list: ({ account }) => [
    ...(account?.highscores?.coloHighscores ?? []).map((row) => ({ ...row, type: 'colo' })),
    ...(account?.highscores?.minigameHighscores ?? []).map((row) => ({ ...row, type: 'minigame' }))
  ],
  key: (row) => `${row.type}:${row.name}`,
  name: (row) => capitalizeFirst(String(row.name ?? '')),
  // the tables have no art: the colosseum ticket and the minigame plays icons stand in
  icon: (row) => (row.type === 'colo' ? 'data/TixCol' : 'data/MGp'),
  metrics: {
    score: { label: 'Score', value: (row) => parseInt(row.score) || 0 }
  }
};
