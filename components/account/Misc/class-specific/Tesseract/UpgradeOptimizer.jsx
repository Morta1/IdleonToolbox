import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import { getOptimizedTesseractUpgrades, TESSERACT_UPGRADE_CATEGORIES, tachyonNames } from '@parsers/tesseract';

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
    tooltipText="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per tachyon cost."
  />
);

export default UpgradeOptimizer; 