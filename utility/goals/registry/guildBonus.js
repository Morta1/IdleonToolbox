import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'guildBonus',
  label: 'Guild bonuses',
  entryLabel: 'guild bonus',
  scope: 'account',
  route: GOAL_ROUTES.guildBonus,
  // the parser maps the catalog 1:1 (also for a locked guild), so the position is the game's bonus index
  list: ({ account }) => (account?.guild?.guildBonuses ?? []).map((bonus, index) => ({ ...bonus, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/Gbonus${row.index}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
