import React from 'react';
import GenericUpgradeOptimizer from '@components/account/Misc/class-specific/GenericUpgradeOptimizer';
import { CLAM_WORK_UPGRADE_CATEGORIES, getOptimizedClamWorkUpgrades, pearlNames } from '@parsers/world-7/clamWork';

const UpgradeOptimizer = ({ character, account, multiKill }) => (
  <GenericUpgradeOptimizer
    character={character}
    account={account}
    getOptimizedUpgradesFn={(char, acc, category, maxUpgrades, options) => getOptimizedClamWorkUpgrades(
      char, acc, category, maxUpgrades, { ...options, multiKill }
    )}
    upgradeCategories={CLAM_WORK_UPGRADE_CATEGORIES}
    defaultCategory="pearlGain"
    resourceNames={pearlNames}
    resourceKey="clamWork.pearls"
    resourceImagePrefix="ClamPearl"
    // The game draws clam upgrade icons as font glyphs, so there is no per-upgrade sprite to use.
    upgradeImagePrefix="ClamPearl"
    getUpgradeIconIndex={() => 0}
    getResourceType={() => 0}
    showMasterclassReduction={false}
    showSplitByResource={false}
    statLabels={{ pearlGain: 'Pearl gain', costReduction: 'Cost reduction' }}
    tooltipText={'Shows the most efficient upgrade path based on your available pearls, in order. Pearl Gain ranks upgrades by pearl income per pearl spent; Cost Reduction ranks Frugality and Anti Inflation by how much cheaper they make everything else.'}
  />
);

export default UpgradeOptimizer;
