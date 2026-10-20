import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'sticker',
  label: 'Stickers',
  entryLabel: 'sticker',
  scope: 'account',
  route: GOAL_ROUTES.sticker,
  // the parser has already dropped Nonexistent_Sticker; the page draws FarmStickerB<position in that list>
  list: ({ account }) => (account?.farming?.stickers ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => row.name,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/FarmStickerB${row.pos}`,
  metrics: {
    count: { label: 'Found', value: (row) => row.count ?? 0 }
  }
};
