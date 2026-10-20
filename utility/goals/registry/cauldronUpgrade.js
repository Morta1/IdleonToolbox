import { CAULDRON_INFO, CAULDRONS_MAX_LEVELS, LIQUID_INFO } from '@parsers/world-2/alchemy';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const CAULDRON_PARTS = [
  { part: 'speed', label: 'Speed', max: CAULDRONS_MAX_LEVELS.cauldronsSpeed },
  { part: 'newBubble', label: 'New bubble chance', max: CAULDRONS_MAX_LEVELS.cauldronsNewBubble },
  { part: 'boostReq', label: 'Boost req', max: CAULDRONS_MAX_LEVELS.cauldronsBoostReq }
];
const LIQUID_PARTS = [
  { part: 'regen', label: 'Regen', max: CAULDRONS_MAX_LEVELS.liquidsRegen },
  { part: 'capacity', label: 'Capacity', max: CAULDRONS_MAX_LEVELS.liquidsCapacity }
];

const rowsOf = (kind, catalog, items, parts) => catalog.flatMap(({ name }, index) => parts.map(({ part, label, max }) => ({
  kind, index, part, max, level: items?.[index]?.[part]?.level ?? 0, name: `${capitalize(name)} ${label.toLowerCase()}`
})));

export default {
  system: 'cauldronUpgrade',
  label: 'Cauldron upgrades',
  entryLabel: 'cauldron upgrade',
  scope: 'account',
  route: GOAL_ROUTES.cauldronUpgrade,
  groups: {
    label: 'Type',
    of: (row) => row.kind,
    names: { cauldron: 'Cauldron', liquid: 'Liquid' }
  },
  // The loops walk CAULDRON_INFO / LIQUID_INFO, the same catalogs the parser builds p2w from
  list: ({ account }) => {
    const p2w = account?.alchemy?.p2w;
    return [
      ...rowsOf('cauldron', CAULDRON_INFO, p2w?.cauldrons, CAULDRON_PARTS),
      ...rowsOf('liquid', LIQUID_INFO, p2w?.liquids, LIQUID_PARTS)
    ];
  },
  key: (row) => `${row.kind}:${row.index}:${row.part}`,
  name: (row) => row.name,
  icon: (row) => `data/${row.kind === 'cauldron' ? 'aJarB' : 'aJarL'}${row.index}`,
  metrics: {
    level: {
      label: 'Level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.max),
      steps: [10, 50]
    }
  }
};
