import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { dustNames, getOptimizedUpgrades, UPGRADE_CATEGORIES } from '@parsers/class-specific/compass';

// The game lists compass upgrades path by path, each path in its own authored order, so the
// upgrade index says nothing about where a row sits in the menu.
const getGamePositions = (account) => {
  const positions = new Map();
  (account?.compass?.groupedUpgrades ?? []).flatMap(({ list }) => list).forEach((upgrade) => {
    if (!positions.has(upgrade.index)) positions.set(upgrade.index, positions.size);
  });
  return positions;
};

const UpgradeOptimizer = ({ character, account }) => {
  const gamePositions = getGamePositions(account);
  return <GenericUpgradeOptimizer
    character={character}
    account={account}
    getOptimizedUpgradesFn={getOptimizedUpgrades}
    upgradeCategories={UPGRADE_CATEGORIES}
    resourceNames={dustNames}
    resourceKey="compass.dusts"
    resourceImagePrefix="Dust"
    upgradeImagePrefix="CompassUpg"
    getResourceType={upgrade => upgrade.x3}
    getUpgradeIconIndex={upgrade => (upgrade.baseIconIndex != null && upgrade.baseIconIndex >= 0 ? upgrade.baseIconIndex + 106 : upgrade.index)}
    getGameOrder={upgrade => gamePositions.get(upgrade.index)}
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per dust cost."
  />;
};

export default UpgradeOptimizer;