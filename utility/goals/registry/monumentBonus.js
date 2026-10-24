import { holesInfo } from '@website-data';
import { GOAL_ROUTES } from '../routes';
import { withoutValue } from './names';

const MONUMENTS = ['bravery', 'justice', 'wisdom'];
const MONUMENT_NAMES = ['Bravery', 'Justice', 'Wisdom'];
const MONUMENT_CAVERNS = [3, 9, 12];
const BONUSES_PER_MONUMENT = 10;

// The cards print the live bonus, so the name is the catalog text without its number ("+{%|Mining|Efficiency")
const baseName = (monument, pos) => withoutValue(holesInfo?.[32]?.[BONUSES_PER_MONUMENT * monument + pos]);

export default {
  system: 'monumentBonus',
  label: 'Monument bonuses',
  entryLabel: 'monument bonus',
  scope: 'account',
  route: GOAL_ROUTES.monumentBonus,
  groups: {
    label: 'Monument',
    of: (row) => String(row.monument),
    names: { 0: 'Bravery', 1: 'Justice', 2: 'Wisdom' }
  },
  list: ({ account }) => {
    const rows = MONUMENTS.flatMap((cavern, monument) => (account?.hole?.caverns?.[cavern]?.bonuses ?? [])
      .map((row, pos) => ({ ...row, monument, pos, base: baseName(monument, pos) })));
    // the villager EXP and AFK bonuses sit on every monument: those carry the monument name
    const repeated = new Set(rows.filter((row, i) => rows.findIndex((other) => other.base === row.base) !== i).map((row) => row.base));
    return rows.map((row) => ({
      ...row,
      goalName: repeated.has(row.base) ? `${row.base} (${MONUMENT_NAMES[row.monument]})` : row.base
    }));
  },
  key: (row) => `${row.monument}:${row.pos}`,
  name: (row) => row.goalName,
  // the cards have no art: each monument's cavern icon stands in
  icon: (row) => `etc/Cavern_${MONUMENT_CAVERNS[row.monument]}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
