import { ARCADE_OMEGA_LEVEL, isArcadePlaceholder } from '@parsers/world-2/arcade';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

// Same stripping as getArcadeBonus: the leading number marker is dropped, the rest is the stat
const statName = (effect) => cleanUnderscore((effect ?? '').replace(/^[^A-Za-z]*(x_)?/, ''));

export default {
  system: 'arcade',
  label: 'Arcade shop',
  entryLabel: 'arcade upgrade',
  scope: 'account',
  route: GOAL_ROUTES.arcade,
  // The shop is 1:1 with the catalog; the index is taken before the placeholder rows are dropped.
  // The game repeats some stat names (Cash from Mobs), so a repeat gets its number.
  list: ({ account }) => {
    const rows = (account?.arcade?.shop ?? []).map((upgrade, index) => ({ ...upgrade, index }));
    const live = rows.filter((upgrade) => !isArcadePlaceholder(upgrade));
    const counts = new Map();
    for (const { effect } of live) counts.set(statName(effect), (counts.get(statName(effect)) ?? 0) + 1);
    return live.map((upgrade) => {
      const base = statName(upgrade.effect);
      return { ...upgrade, label: counts.get(base) > 1 ? `${base} #${upgrade.index + 1}` : base };
    });
  },
  key: (row) => String(row.index),
  name: (row) => row.label,
  icon: (row) => `data/${row.iconName}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: () => ARCADE_OMEGA_LEVEL,
      steps: [100]
    }
  }
};
