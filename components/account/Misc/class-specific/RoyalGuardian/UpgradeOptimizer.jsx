import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import {
  ARMORY_UPGRADE_CATEGORIES,
  getOptimizedArmoryUpgrades,
  ROYAL_RESOURCE_NAMES
} from '@parsers/class-specific/royalGuardian';

const UpgradeOptimizer = ({ character, account }) => (
  <GenericUpgradeOptimizer
    character={character}
    account={account}
    getOptimizedUpgradesFn={getOptimizedArmoryUpgrades}
    upgradeCategories={ARMORY_UPGRADE_CATEGORIES}
    defaultCategory="all"
    resourceNames={ROYAL_RESOURCE_NAMES}
    // account.royalGuardian.raw[1] is RoyalG[1], the per-resource storage array the parser also
    // reads for `resources[i].stored` - resourceKey walks it as account.royalGuardian.raw['1'].
    resourceKey="royalGuardian.raw.1"
    resourceImagePrefix="RGres"
    resourceImageSuffix="" // RGres{n}.png has no _x1 variant, unlike the other masterclasses' currencies
    upgradeImagePrefix="RGres"
    // The armory has no per-upgrade icon asset; the game itself renders each shelf slot with its
    // own currency icon, so the "upgrade icon" and "resource icon" are the same file.
    getUpgradeIconIndex={(upgrade) => upgrade.costResourceIndex}
    getResourceType={(upgrade) => upgrade.costResourceIndex}
    getResourceAmount={(amount) => amount}
    // The parser already bakes the current masterclass cost reduction into every armory cost
    // (royalGuardian.ts, getArmoryCostReduction) - a second reduction control here would double it,
    // and the shared control's own reduction model (First3MC_CostRedux) never applies to the armory
    // at all. See task C2 report, "Critical trap".
    showMasterclassReduction={false}
    tooltipText="Shows the cheapest available armory upgrade to buy next, in order. Unlike Grimoire/Compass/Tesseract, armory upgrades don't share a common stat, so this ranks by cost only."
  />
);

export default UpgradeOptimizer;
