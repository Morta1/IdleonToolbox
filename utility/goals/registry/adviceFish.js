import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const ADVICE_ART_COUNT = 6;

export default {
  system: 'adviceFish',
  label: 'Advice Fish upgrades',
  entryLabel: 'advice',
  scope: 'account',
  route: GOAL_ROUTES.adviceFish,
  list: ({ account }) => (account?.adviceFish?.upgrades ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.name ?? ''),
  // public/etc ships art for the first six advices only; later ones show the page icon
  icon: (row) => (row.pos < ADVICE_ART_COUNT ? `etc/Advice_Fish_${row.pos}` : 'data/W7_fish'),
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
