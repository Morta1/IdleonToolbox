import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers } from './names';

export default {
  system: 'zenithUpgrade',
  label: 'Zenith Market upgrades',
  entryLabel: 'zenith upgrade',
  scope: 'account',
  route: GOAL_ROUTES.zenithUpgrade,
  list: ({ account }) => (account?.zenith?.market ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => titleCaseTiers(row.name),
  // the market cards have no art; the page's Zenith Cluster icon stands in
  icon: () => 'etc/Cluster',
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.x3) }
  }
};
