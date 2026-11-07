import { cleanUpgradeName } from '@utility/goals/registry/names';
import { titleCaseName } from '@utility/helpers';
import React, { useContext } from 'react';
import Notice from '@components/common/Notice';
import { AppContext } from '@components/common/context/AppProvider';
import GenericUpgradeOptimizer from '@components/account/Misc/class-specific/GenericUpgradeOptimizer';
import { getOptimizedScurgeUpgrades, SCURGE_UPGRADE_CATEGORIES, scurgePointNames } from '@parsers/world-7/clamWork';

const ScurgeOptimizer = ({ character, account, multiKill, sectionFailed }) => {
  const { state } = useContext(AppContext);
  // Locked, the plan has nothing to buy with: the note alone. A guest gets the optimizer's sign-in note instead, and a
  // failed section the page's note.
  if (!sectionFailed && !state?.emptyAccount && !account?.clamWork?.scurge?.unlocked) {
    return <Notice tone={'locked'}>Scurge unlocks from the Luminous Menagerie.</Notice>;
  }
  return <GenericUpgradeOptimizer
    upgradeTitle={(name) => titleCaseName(cleanUpgradeName(name))}
    character={character}
    account={account}
    sectionFailed={sectionFailed}
    getOptimizedUpgradesFn={(char, acc, category, maxUpgrades, options) => getOptimizedScurgeUpgrades(
      char, acc, category, maxUpgrades, { ...options, multiKill }
    )}
    upgradeCategories={SCURGE_UPGRADE_CATEGORIES}
    defaultCategory="scurgeExp"
    resourceNames={scurgePointNames}
    resourceKey="clamWork.scurge.points"
    // The game draws Scurge points as a font glyph (font 336 "|"), extracted to etc/
    resourceImageDir="etc/"
    resourceImagePrefix="ScurgePoint"
    resourceImageSuffix=""
    getResourceType={() => 0}
    usesMasterclassReduction={false}
    showSplitByResource={false}
    // Points come from Scurge levels, not an hourly income
    showResourcePerHour={false}
    statLabels={{ scurgeExp: 'Scurge EXP', pearlGain: 'Pearl gain', costReduction: 'Pearl cost reduction' }}
    tooltipText={'Shows where to spend Scurge points, in order. Every upgrade costs 1 point, so each one is ranked by how much it adds. Scurge EXP ranks Reckoning and Even Better by EXP per kill; the Self Affliction variant also counts it, but each level cuts your damage by 100x. Pearl Gain ranks Pearl Infection and True Scurge, Pearl Cost Reduction ranks Cost Dissolving and Cross Culting. Gravestart and Swarming are left out: one speeds up levelling, the other depends on other players on the map.'}
  />;
};

export default ScurgeOptimizer;
