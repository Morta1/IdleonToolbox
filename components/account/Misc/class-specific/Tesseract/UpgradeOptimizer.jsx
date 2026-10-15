import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { getOptimizedTesseractUpgrades, TESSERACT_UPGRADE_CATEGORIES, tachyonNames } from '@parsers/class-specific/tesseract';

const UpgradeOptimizer = ({ character, account }) => (
  <GenericUpgradeOptimizer
    character={character}
    account={account}
    getOptimizedUpgradesFn={getOptimizedTesseractUpgrades}
    upgradeCategories={TESSERACT_UPGRADE_CATEGORIES}
    resourceNames={tachyonNames}
    resourceKey="tesseract.tachyons"
    resourceImagePrefix="Tach"
    upgradeImagePrefix="ArcaneUpg"
    getResourceType={upgrade => upgrade.x3}
    optimizerOptions={{ sharedFarmingTime: true }}
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per tachyon cost. With a resource per hour method in All, upgrades your stock already covers come first, then the fewest hours of farming, counting the hours of every earlier pick since all tachyons share your play time."
  />
);

export default UpgradeOptimizer; 