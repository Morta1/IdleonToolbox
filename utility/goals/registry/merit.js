import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

export default {
  system: 'merit',
  label: 'Merits',
  entryLabel: 'merit',
  scope: 'account',
  route: GOAL_ROUTES.merit,
  list: ({ account }) => (account?.meritsDescriptions ?? []).flatMap((merits, world) =>
    (merits ?? [])
      .map((merit, i) => ({ ...merit, world, i }))
      .filter(({ descLine1, meritCost }) => descLine1 !== 'IDK_YET' && meritCost !== null)),
  key: (row) => `${row.world}:${row.i}`,
  // the catalog lines, not the parsed description, which fills in the bonus at the current level
  name: (row) => stableText(`${row.descLine1}${row.descLine2 !== 'Descline2' ? `_${row.descLine2}` : ''}`),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    level: {
      label: 'Purchases',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.totalLevels)
    }
  }
};
