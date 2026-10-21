import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { ARTIFACT_TIERS } from '@components/account/Worlds/World5/Sailing/sailing.consts';

export const ARTIFACT_TIER_LABELS = ['None', ...ARTIFACT_TIERS.map(({ level, full }) => `Tier ${level}: ${full}`)];

export default {
  system: 'artifact',
  label: 'Artifacts',
  entryLabel: 'artifact',
  scope: 'account',
  route: GOAL_ROUTES.artifact,
  list: ({ account }) => account?.sailing?.artifacts ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    tier: { label: 'Tier', value: (row) => row.acquired ?? 0, tiers: ARTIFACT_TIER_LABELS }
  }
};
