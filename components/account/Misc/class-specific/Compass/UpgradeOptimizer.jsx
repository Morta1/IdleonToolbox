import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { dustNames, getOptimizedUpgrades, UPGRADE_CATEGORIES } from '@parsers/compass';

const UpgradeOptimizer = ({ character, account }) => (
  <GenericUpgradeOptimizer
    character={character}
    account={account}
    getOptimizedUpgradesFn={getOptimizedUpgrades}
    upgradeCategories={UPGRADE_CATEGORIES}
    resourceNames={dustNames}
    resourceKey="compass.dusts"
    resourceImagePrefix="Dust"
    upgradeImagePrefix="CompassUpg"
    getResourceType={upgrade => upgrade.x3}
    getUpgradeIconIndex={upgrade => (upgrade.baseIconIndex >= 0 ? upgrade.baseIconIndex + 106 : upgrade.index)}
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per dust cost."
  />
);

export default UpgradeOptimizer;