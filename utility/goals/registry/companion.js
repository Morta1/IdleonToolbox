import { getCompanionSets } from '@parsers/misc';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'companion',
  label: 'Pets',
  entryLabel: 'pet',
  scope: 'account',
  route: GOAL_ROUTES.companion,
  // the parser maps the companion catalog 1:1, so the position is the pet's index; the page shows the released ones
  list: ({ account }) => {
    const indexed = (account?.companions?.list ?? []).map((companion, index) => ({ ...companion, index }));
    const released = new Set(getCompanionSets(indexed).groups.flatMap((group) => group.indices));
    return withUniqueNames(indexed.filter(({ index }) => released.has(index)), (row) => cleanUnderscore(row.name));
  },
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the pets page draws monsterImage(name); icons here are paths without prefix and extension
  icon: (row) => monsterImage(row.name).slice(prefix.length).replace(/\.\w+$/, ''),
  metrics: {
    owned: { label: 'Owned', value: (row) => (row.copies > 0 ? 1 : 0), boolean: true }
  }
};
