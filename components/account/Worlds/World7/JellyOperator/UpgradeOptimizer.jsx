import React from 'react';
import GenericUpgradeOptimizer from '@components/account/Misc/class-specific/GenericUpgradeOptimizer';
import { getOptimizedJellyUpgrades, JELLY_UPGRADE_CATEGORIES } from '@parsers/world-7/jellyOperator';

// Bloodcells are the only currency; keyed by '' so the icon path resolves to etc/Bloodcell.png.
const resourceNames = { '': 'Bloodcells' };

const UpgradeOptimizer = ({ account, characters }) => {
  // game: "UpgLvREQ" is checked against the Research skill level
  const researchLevel = Math.max(0, ...(characters || []).map((c) => c?.skillsInfo?.research?.level ?? 0));
  return (
    <GenericUpgradeOptimizer
      // The optimizer is account-wide; the component only needs a truthy character to run.
      character={characters?.[0] ?? {}}
      account={account}
      getOptimizedUpgradesFn={(char, acc, category, maxUpgrades, options) => getOptimizedJellyUpgrades(
        char, acc, category, maxUpgrades, { ...options, researchLevel }
      )}
      upgradeCategories={JELLY_UPGRADE_CATEGORIES}
      defaultCategory="dps"
      resourceNames={resourceNames}
      resourceKey="jellyOperator.bloodcellResources"
      resourceImageDir="etc/"
      resourceImagePrefix="Bloodcell"
      resourceImageSuffix=""
      upgradeImagePrefix="JellyUpg"
      getResourceType={() => ''}
      // game: the upgrade menu lists research[44] (display order), not upgrade ids
      getGameOrder={(upgrade) => upgrade.position}
      usesMasterclassReduction={false}
      showSplitByResource={false}
      showResourcePerHour={false}
      statLabels={{ boardDps: 'Board DPS', bloodcellMulti: 'Bloodcell gain', costReduction: 'Cost reduction' }}
      tooltipText={'Shows the most efficient upgrade path for your Bloodcells, in order. Cell DPS ranks upgrades by the total DPS of your current board per Bloodcell spent; Bloodcell Gain by the Bloodcell multiplier; Cost Reduction by how much cheaper Lower Cholesterol makes everything else. Upgrades whose effect the page cannot measure (cell unlocks, slots, fever, revives) are only listed under All.'}
    />
  );
};

export default UpgradeOptimizer;
