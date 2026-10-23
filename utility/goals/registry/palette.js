import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { swatchIcon } from '../icons';

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
  // the page draws each colour as a hexagon filled with its RGB (x0, x1, x2); a row without one keeps the grid tile
  icon: (row) => (Number.isFinite(row.x0) && Number.isFinite(row.x1) && Number.isFinite(row.x2)
    ? swatchIcon(...[row.x0, row.x1, row.x2].map((c) => Math.round(Math.max(0, Math.min(255, c)))))
    : 'data/GamingHexB'),
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
