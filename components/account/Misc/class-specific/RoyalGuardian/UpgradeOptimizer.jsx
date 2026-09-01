import React from 'react';
import GenericUpgradeOptimizer from '../GenericUpgradeOptimizer';
import {
  ARMORY_UPGRADE_CATEGORIES,
  getOptimizedArmoryUpgrades,
  getRoyalResourcePerHour,
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
    // Unlike the other three masterclasses, RG income is passive: outposts bank a fixed rate off the
    // nodes they're wired to, so the rate can be derived instead of typed in. Manual entry stays
    // available as the "(manual)" method.
    autoResourcePerHour={getRoyalResourcePerHour(account)}
    tooltipText="Shows the cheapest available armory upgrade to buy next, in order. Unlike Grimoire/Compass/Tesseract, armory upgrades don't share a common stat, so this ranks by cost only. Auto RPH is read from your outposts and their connected nodes."
  />
);

export default UpgradeOptimizer;
