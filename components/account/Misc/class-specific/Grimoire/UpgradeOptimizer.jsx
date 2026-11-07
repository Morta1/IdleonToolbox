import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { getOptimizedGrimoireUpgrades, GRIMOIRE_UPGRADE_CATEGORIES, boneNames } from '@parsers/class-specific/grimoire';

const UpgradeOptimizer = ({ character, account, fishingEfficiency, sectionFailed }) => (
  <GenericUpgradeOptimizer
    character={character}
    sectionFailed={sectionFailed}
    account={account}
    getOptimizedUpgradesFn={getOptimizedGrimoireUpgrades}
    upgradeCategories={GRIMOIRE_UPGRADE_CATEGORIES}
    resourceNames={boneNames}
    resourceKey="grimoire.bones"
    resourceImagePrefix="Bone"
    upgradeImagePrefix="GrimoireUpg"
    getResourceType={upgrade => upgrade.boneType ?? upgrade.x3}
    optimizerOptions={{ fishingEfficiency, sharedFarmingTime: true }}
    costGame={'Summoning.GrimoireUpgCost'}
    characterLabel={'Death Bringer'}
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per bone cost. With a resource per hour method in All, upgrades your stock already covers come first, then the fewest hours of farming, counting the hours of every earlier pick since all bones share your play time."
  />
);

export default UpgradeOptimizer; 