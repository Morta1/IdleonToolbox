import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const KINDS = { zow: 'Zow', chow: 'Chow', wow: 'Wow' };

export default {
  system: 'apocalypse',
  label: 'Apocalypses',
  entryLabel: 'monster',
  scope: 'character',
  route: GOAL_ROUTES.apocalypse,
  groups: {
    label: 'Apocalypse',
    of: (row) => row.kind,
    names: KINDS
  },
  // afkTarget repeats between maps, the map name does not
  list: ({ character }) => Object.keys(KINDS).flatMap((kind) =>
    (character?.[kind]?.list ?? []).map((monster) => ({ ...monster, kind }))),
  key: (row) => `${row.kind}:${row.mapName}`,
  name: (row) => `${cleanUnderscore(row.name)}, ${cleanUnderscore(row.mapName)} (${KINDS[row.kind]})`,
  icon: (row) => `data/Mface${row.monsterFace}`,
  metrics: {
    kills: { label: 'Kills', value: (row) => (Number.isFinite(row.kills) ? Math.floor(row.kills) : 0) }
  }
};
