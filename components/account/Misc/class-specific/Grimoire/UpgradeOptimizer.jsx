import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { getOptimizedGrimoireUpgrades, GRIMOIRE_UPGRADE_CATEGORIES, boneNames } from '@parsers/class-specific/grimoire';

const UpgradeOptimizer = ({ character, account, fishingEfficiency }) => (
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
    optimizerOptions={{ fishingEfficiency, sharedFarmingTime: true }}
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per bone cost. With a resource per hour method in All, upgrades your stock already covers come first, then the fewest hours of farming, counting the hours of every earlier pick since all bones share your play time."
  />
);

export default UpgradeOptimizer; 