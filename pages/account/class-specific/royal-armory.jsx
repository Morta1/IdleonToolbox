import { Box, MenuItem, TextField } from '@mui/material';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { isSectionFailed, MissingData } from '@components/common/styles';
import Armory from '@components/account/Misc/class-specific/RoyalGuardian/Armory';
import UpgradeOptimizer from '@components/account/Misc/class-specific/RoyalGuardian/UpgradeOptimizer';
import RoyalStatues from '@components/account/Misc/class-specific/RoyalGuardian/RoyalStatues';
import OrbletMarket from '@components/account/Misc/class-specific/RoyalGuardian/OrbletMarket';
import Outposts from '@components/account/Misc/class-specific/RoyalGuardian/Outposts';
import Resources from '@components/account/Misc/class-specific/RoyalGuardian/Resources';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { getRoyalGuardian } from '@parsers/class-specific/royalGuardian';
import { createBreakdown, flatLines, info } from '@parsers/breakdown';
import useMasterclassCostControls from '@components/account/Misc/class-specific/useMasterclassCostControls';
import useTabIndex from '@hooks/useTabIndex';

// The game's "1 in N" for a marble's chance per kill
const marbleText = (chance) => (chance > 0 ? `1 in ${formatGame(1 / chance, 'RoyalG.MarbleDrop', { whole: true })}` : '-');
// A failed section's catalogs at zero, from the parser's own empty save: every shelf, statue and orblet upgrade by name
const zeroRoyalGuardian = () => {
  try {
    return getRoyalGuardian({}, {}, []);
  }
  catch {
    return {};
  }
};

// The kingdom's own lists: no catalog to draw at zero
const BLANK_WHEN_FAILED = ['Outposts', 'Resources', 'Upgrade Optimizer'];

const RoyalArmory = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['class-specific'].categories, 'royalArmory');
  const [tabIndex] = useTabIndex(tabs);
  const sectionFailed = isSectionFailed(state?.account, 'royalGuardian');
  const royalGuardian = state?.account?.royalGuardian;
  const catalog = sectionFailed ? zeroRoyalGuardian() : null;
  const { armory, royalStatues, statueFlair, orbletMarket, orblets, outpostStats, raw, resourceStorage } = royalGuardian ?? {};
  // Remembered per page; no default, so a pick that was never made keeps following the first Royal Guardian
  const [selectedChar, setSelectedChar] = useLocalStorage({ key: 'royal-armory:selectedChar' });
  const royalGuardians = (state?.characters ?? []).filter((character) => checkCharClass(character?.class, CLASSES.Royal_Guardian));
  const selectedRoyalGuardian = royalGuardians.find((character) => character?.playerId === selectedChar) ?? royalGuardians[0];
  const selectedRogBonus = outpostStats?.rogBonuses?.find((bonus) => bonus?.selected);
  const { marbleDropChanceEffective, marblesDropped, marbleEarlyBoost } = royalGuardian?.guardian ?? {};
  // Levels ahead and the Daily Shopping Spree price the Armory tab: in the page's gear, under the tab's name
  const { gear: costSettings, ...costing } = useMasterclassCostControls(state?.account, 'royal-armory', 'Armory');
  // The chance by world is a list, so a breakdown (Info board step 5), headed with the tile's own World 1 chance
  const marbleBreakdown = marbleDropChanceEffective?.length ? createBreakdown('Marble chance', marbleText(marbleDropChanceEffective[0]), [
    ...flatLines(marbleDropChanceEffective.map((chance, world) => ({ name: `World ${world + 1}`, value: chance, formatted: marbleText(chance) }))),
    // The early-marble boost: 99x on the first marble, 1 less per marble found, used up at the 99th
    info('Early-marble boost', marbleEarlyBoost ?? 1, {
      formatted: marbleEarlyBoost > 1
        ? `${formatNum(marbleEarlyBoost)}x (${formatNum(marblesDropped ?? 0)} found)`
        : `Used up (${formatNum(marblesDropped ?? 0)} found)`
    })
  ], { combine: 'list' }) : null;
  // A tile the failed section feeds shows no number
  const shown = (value) => (sectionFailed ? '-' : value);

  return <>
    <NextSeo
      title="Royal Armory | Idleon Toolbox"
      description="Keep track of your Royal Guardian's armory, royal statues, statue flair and orblet market"
    />
    {sectionFailed ? <MissingData name={'Royal Armory'} failed atZero={!BLANK_WHEN_FAILED.includes(tabs[tabIndex])}/> : null}
    {armory?.upgrades?.length ? costSettings : null}
    {royalGuardians.length > 1 ? <PageHeaderControl>
      <TextField select value={selectedRoyalGuardian?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {royalGuardians.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Royal Guardian' }
                   }
                 }}>
        {royalGuardians.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{cleanUnderscore(character?.name)}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    <PageSummary>
      <StatTile label={'Total armory levels'} value={shown(formatGame(armory?.totalLevels ?? 0, 'RoyalG.ArmoryUpgTotal', { whole: true }))}/>
      <StatTile label={'Shelves unlocked'}
                value={shown(`${formatNum(armory?.unlockedSlots ?? 0)} / ${formatNum(armory?.slotToId?.length ?? 0)}`)}/>
      <StatTile label={'Outposts built'} value={shown(formatGame(outpostStats?.built ?? 0, 'RoyalG.TotalStatz', { whole: true }))}/>
      {sectionFailed ? <StatTile label={'Marble chance'} value={'-'}/>
        : marbleBreakdown ? <StatTile label={'Marble chance'} sub={'World 1, per kill on an outpost map'}
                                      value={marbleText(marbleDropChanceEffective[0])} breakdown={marbleBreakdown}
                                      breakdownTitle={'Marble chance'} breakdownNoun={'worlds'}/> : null}
      {!sectionFailed && selectedRogBonus
        ? <StatTile label={selectedRogBonus.name} value={`${formatGame(selectedRogBonus.value ?? 1, 'RoyalG.OutpostROGbon')}x`}/>
        : null}
    </PageSummary>
    <Tabber tabs={tabs}>
      <Armory account={state?.account} upgrades={catalog?.armory?.upgrades ?? armory?.upgrades} resourceStorage={resourceStorage}
              resourcePerHour={royalGuardian?.resourcePerHour} costing={costing} sectionFailed={sectionFailed}/>
      <Outposts outposts={royalGuardian?.outposts} outpostStats={outpostStats}
                resources={royalGuardian?.resources} clearingMaps={royalGuardian?.clearingMaps}
                activeKillClear={royalGuardian?.guardian?.activeKillClear} sectionFailed={sectionFailed}/>
      <Resources resources={royalGuardian?.resources} outposts={royalGuardian?.outposts}
                 resourcePerHour={royalGuardian?.resourcePerHour} sectionFailed={sectionFailed}/>
      <UpgradeOptimizer account={state?.account} character={selectedRoyalGuardian} sectionFailed={sectionFailed}/>
      <RoyalStatues royalStatues={catalog?.royalStatues ?? royalStatues} statueFlair={statueFlair} statueLevels={raw?.[0]}
                    sectionFailed={sectionFailed}/>
      <OrbletMarket orbletMarket={catalog?.orbletMarket ?? orbletMarket} orblets={orblets} sectionFailed={sectionFailed}/>
    </Tabber>
  </>;
};

export default RoyalArmory;
