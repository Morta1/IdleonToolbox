import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

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
  name: (row) => cleanUnderscore(`${row.description}${row.descLine2 !== 'Descline2' ? ` ${row.descLine2}` : ''}`),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    level: {
      label: 'Purchases',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.totalLevels)
    }
  }
};
