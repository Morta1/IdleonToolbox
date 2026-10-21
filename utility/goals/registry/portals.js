import { cleanUnderscore } from '@utility/helpers';

// Mining and fishing maps idle on an ore or a fish, which has no monster face (as the Compass Portals tab)
const SKILL_MAP_ICONS = { MINING: 'ClassIconsM', FISHING: 'ClassIcons45' };

// One row per portal map: how many of its portals are open, out of the map's portals
export const portalsDescriptor = ({ system, label, route, list }) => ({
  system,
  label,
  entryLabel: 'map',
  scope: 'account',
  route,
  list,
  key: (row) => String(row.mapIndex),
  name: (row) => cleanUnderscore(row.mapName),
  icon: (row) => `data/${SKILL_MAP_ICONS[row.afkType] ?? `Mface${row.monster?.MonsterFace ?? 0}`}`,
  metrics: {
    portals: {
      label: 'Portals unlocked',
      value: (row) => (row.portals ?? []).filter(({ unlocked }) => unlocked).length,
      max: (row) => (row.portals?.length > 0 ? row.portals.length : null)
    }
  }
});
