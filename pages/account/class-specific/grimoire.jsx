import { Box, MenuItem, TextField } from '@mui/material';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { isParseFailed, isSectionFailed, MissingData } from '@components/common/styles';
import Upgrades from '@components/account/Misc/class-specific/Grimoire/Upgrades';
import Monsters from '@components/account/Misc/class-specific/Grimoire/Monsters';
import { boneNames, getGrimoire, getWraithStats } from '@parsers/class-specific/grimoire';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Grimoire/UpgradeOptimizer';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { getMaxDamage } from '@parsers/damage';
import { getSkillEfficiency } from '@parsers/efficiency';
import useMasterclassCostControls from '@components/account/Misc/class-specific/useMasterclassCostControls';
import useTabIndex from '@hooks/useTabIndex';
import FormStats from '@components/account/Misc/class-specific/FormStats';

// The Wraith Form stat panel's rows, in the game's names, each in its game rule (Summoning.Grimoire_*)
const wraithRows = (stats) => [
  ['Max HP', formatGame(stats?.hp, 'Summoning.Grimoire_HP')],
  ['Damage', formatGame(stats?.damage, 'Summoning.Grimoire_DMG')],
  ['Accuracy', formatGame(stats?.accuracy, 'Summoning.Grimoire_ACC')],
  ['Defence', formatGame(stats?.defence, 'Summoning.Grimoire_DEF')],
  ['Crit chance', `${formatGame(stats?.critChance, 'Summoning.Grimoire_CRITPCT')}%`],
  ['Crit damage', `${formatGame(stats?.critDamage, 'Summoning.Grimoire_CRITDMG')}x`]
];
// One to three columns of rows, as wide as the page allows
// A failed section's catalogs at zero, from the parser's own empty save: every upgrade and monster by name
const zeroGrimoire = () => {
  try {
    return getGrimoire({}, [], {});
  }
  catch {
    return {};
  }
};

const Grimoire = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['class-specific'].categories, 'grimoire');
  const [tabIndex] = useTabIndex(tabs);
  const sectionFailed = isSectionFailed(state?.account, 'grimoire');
  const { bones, upgrades, monsterDrops, totalUpgradeLevels, nextUnlock, totalBonesCollected } = state?.account?.grimoire || {};
  const catalog = sectionFailed ? zeroGrimoire() : null;
  // Remembered per page; no default, so a pick that was never made keeps following the first Death Bringer
  const [selectedChar, setSelectedChar] = useLocalStorage({ key: 'grimoire:selectedChar' });
  const deathBringers = (state?.characters ?? []).filter((character) => checkCharClass(character?.class, CLASSES.Death_Bringer));
  const selectedCharacter = deathBringers.find((character) => character?.playerId === selectedChar) ?? deathBringers[0];
  const fishingEfficiency = selectedCharacter
    ? getSkillEfficiency('fishing', selectedCharacter, state?.characters, state?.account,
      getMaxDamage(selectedCharacter, state?.characters, state?.account))?.value
    : 0;
  const wraithStats = getWraithStats(selectedCharacter, state?.account, fishingEfficiency);
  // Levels ahead and the Daily Shopping Spree price the Upgrades tab: in the page's gear, under the tab's name
  const { gear: costSettings, ...costing } = useMasterclassCostControls(state?.account, 'grimoire');
  // The drawer is named and headed as the tile reads
  const extraBonesText = `${formatGame(wraithStats?.extraBones ?? 1, 'Summoning.GrimoireBonesDropDEC')}x`;
  // A tile the failed section feeds shows no number
  const shown = (value) => (sectionFailed ? '-' : value);
  const formMeta = selectedCharacter?.name
    ?? (state?.emptyAccount ? 'Sign in to see your Death Bringer' : isParseFailed(state?.account) ? undefined : 'No Death Bringer on this account');

  return <>
    <NextSeo
      title="Grimoire | Idleon Toolbox"
      description="Keep track of your grimoire levels, upgrades and wraith stats"
    />
    {sectionFailed ? <MissingData name={'Grimoire'} failed atZero={tabs[tabIndex] !== 'Upgrade Optimizer'}/> : null}
    {upgrades?.length ? costSettings : null}
    {deathBringers.length > 1 ? <PageHeaderControl>
      <TextField select value={selectedCharacter?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {deathBringers.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Death Bringer' }
                   }
                 }}>
        {deathBringers.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{cleanUnderscore(character?.name)}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    <PageSummary>
      <StatTile label={'Total levels'} value={shown(formatNum(totalUpgradeLevels ?? 0))}/>
      <StatTile label={'Total bones collected'} value={shown(formatNum(totalBonesCollected ?? 0, 'whole'))}/>
      <StatTile label={'Extra bones'} value={shown(extraBonesText)} breakdownTitle={'Extra bones'}
                breakdown={!sectionFailed && wraithStats?.extraBonesBreakdown
                  ? { ...wraithStats.extraBonesBreakdown, totalValue: extraBonesText }
                  : undefined}/>
      {sectionFailed ? <StatTile label={'Next upgrade'} value={'-'}/>
        : nextUnlock?.name ? <StatTile label={'Next upgrade'} value={cleanUpgradeName(nextUnlock.name)}
                                       sub={`At ${formatNum(nextUnlock.unlockLevel)} total ${nextUnlock.unlockLevel === 1 ? 'level' : 'levels'}`}
                                       info={cleanUnderscore(nextUnlock.description ?? '')}/> : null}
      {/* Every bone cost on the Upgrades tab prints in this rule, so the balances do too */}
      {boneNames.map((name, index) => <StatTile key={name} label={name} icon={`data/Bone${index}_x1.png`}
                                                value={shown(formatGame(bones?.[index] ?? 0, 'Summoning.GrimoireUpgCost', { whole: true }))}/>)}
    </PageSummary>
    <FormStats title={'Wraith Form'} meta={formMeta} rows={wraithRows(wraithStats)} shown={Boolean(selectedCharacter && !sectionFailed)}/>
    <Tabber tabs={tabs}>
      <Upgrades account={state?.account} upgrades={catalog?.upgrades ?? upgrades} bones={bones} costing={costing}
                sectionFailed={sectionFailed}/>
      <UpgradeOptimizer account={state?.account} character={selectedCharacter}
                        fishingEfficiency={fishingEfficiency} sectionFailed={sectionFailed}/>
      <Monsters monsters={catalog?.monsterDrops ?? monsterDrops}/>
    </Tabber>
  </>;
};

export default Grimoire;
