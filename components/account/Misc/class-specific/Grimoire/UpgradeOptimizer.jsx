import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { getOptimizedGrimoireUpgrades, GRIMOIRE_UPGRADE_CATEGORIES, boneNames } from '@parsers/grimoire';

const UpgradeOptimizer = ({ character, account }) => (
  <GenericUpgradeOptimizer
    character={character}
    account={account}
    getOptimizedUpgradesFn={getOptimizedGrimoireUpgrades}
    upgradeCategories={GRIMOIRE_UPGRADE_CATEGORIES}
    resourceNames={boneNames}
    resourceKey="grimoire.bones"
    resourceImagePrefix="Bone"
    upgradeImagePrefix="GrimoireUpg"
    getResourceType={upgrade => upgrade.boneType ?? upgrade.x3}
    getResourceAmount={(bone, idx) => bone}
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per bone cost."
  />
);

export default UpgradeOptimizer; 