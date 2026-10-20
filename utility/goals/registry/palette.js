import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'palette',
  label: 'Palette colours',
  entryLabel: 'colour',
  scope: 'account',
  route: GOAL_ROUTES.palette,
  // the parser appends the final bonus (a number) after the 37 colours
  list: ({ account }) => (account?.gaming?.palette ?? []).flatMap((row, pos) => (row && typeof row === 'object' ? [{ ...row, pos }] : [])),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.name),
  // the page draws no icon per colour; its hexagon grid tile stands for it
  icon: () => 'data/GamingHexB',
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
