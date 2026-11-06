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
import Panel from '@components/common/cards/Panel';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { isSectionFailed, MissingData } from '@components/common/styles';
import Upgrades from '@components/account/Misc/class-specific/Compass/Upgrades';
import { amountPair } from '@components/account/Misc/class-specific/MasterclassUpgradeCard';
import Abominations from '@components/account/Misc/class-specific/Compass/Abominations';
import Medallions from '@components/account/Misc/class-specific/Compass/Medallions';
import Portals from '@components/account/Misc/class-specific/Compass/Portals';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Compass/UpgradeOptimizer';
import { dustNames, getCompass, getCompassStats, getExtraDust } from '@parsers/class-specific/compass';
import { checkCharClass, CLASSES } from '@parsers/talents';
import useMasterclassCostControls from '@components/account/Misc/class-specific/useMasterclassCostControls';
import useTabIndex from '@hooks/useTabIndex';

// The Tempest Form stat panel's rows, in the game's names, each in its game rule (Windwalker.Compass_*)
const tempestRows = (stats) => [
  ['HP', formatGame(stats?.hp, 'Windwalker.Compass_HP')],
  ['Damage', formatGame(stats?.damage, 'Windwalker.Compass_DMG')],
  ['Accuracy', formatGame(stats?.accuracy, 'Windwalker.Compass_ACC')],
  ['Defence', formatGame(stats?.defence, 'Windwalker.Compass_DEF')],
  ['Mastery', formatNum(stats?.mastery, 'pct')],
  ['Crit chance', `${formatGame(stats?.critPct, 'Windwalker.Compass_CRITPCT')}%`],
  ['Crit damage', `${formatGame(stats?.critDamage, 'Windwalker.Compass_CRITDMG')}x`],
  // The game's stat panel prints 100 plus the bonus; the parser's move speed already holds the 100.
  ['Attack speed', `${formatGame(100 + (stats?.attackSpeed ?? 0), 'Windwalker.Compass_AttackSpdPCT')}%`],
  ['Invulnerable time', formatNum(stats?.invulnerableTime, 'amount', { precise: true })],
  ['Range', formatNum(stats?.range)],
  ['Move speed', `${formatGame(stats?.moveSpeed, 'Windwalker.Compass_MoveSpeed')}%`],
  ['Multishot', formatNum(stats?.multiShotPct, 'pct')]
];
// A failed section's catalogs at zero, from the parser's own empty save: every upgrade, abomination, medallion and
// portal by name, with no progress
const zeroCompass = () => {
  try {
    return getCompass({}, [], {}, {});
  }
  catch {
    return {};
  }
};
// One to three columns of rows, as wide as the page allows
const FORM_GRID_SX = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, py: 0.5 };

const Compass = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['class-specific'].categories, 'compass');
  const [tabIndex] = useTabIndex(tabs);
  const sectionFailed = isSectionFailed(state?.account, 'compass');
  const {
    groupedUpgrades,
    abominations,
    dusts,
    medallions,
    maps,
    usedExaltedStamps,
    remainingExaltedStamps,
    totalUpgradeLevels,
    totalDustsCollected,
    totalAcquiredMedallions,
    topOfTheMorninKills
  } = state?.account?.compass || {};
  const catalog = sectionFailed ? zeroCompass() : null;
  // Remembered per page; no default, so a pick that was never made keeps following the first Wind Walker
  const [selectedChar, setSelectedChar] = useLocalStorage({ key: 'compass:selectedChar' });
  const windWalkers = (state?.characters ?? []).filter((character) => checkCharClass(character?.class, CLASSES.Wind_Walker));
  const selectedWindWalker = windWalkers.find((character) => character?.playerId === selectedChar) ?? windWalkers[0];
  const tempestStats = getCompassStats(selectedWindWalker, state?.account);
  const extraDust = getExtraDust(selectedWindWalker, state?.account);
  // Levels ahead and the Daily Shopping Spree price the Upgrades tab: in the page's gear, under the tab's name
  const { gear: costSettings, ...costing } = useMasterclassCostControls(state?.account, 'compass');
  // The drawer is named and headed as the tile reads
  const extraDustText = `${formatGame(extraDust?.value ?? 1, 'Windwalker.ExtraDust')}x`;
  // A tile the failed section feeds shows no number
  const shown = (value) => (sectionFailed ? '-' : value);
  const formMeta = selectedWindWalker?.name
    ?? (state?.emptyAccount ? 'Sign in to see your Wind Walker' : 'No Wind Walker on this account');

  return <>
    <NextSeo
      title="Compass | Idleon Toolbox"
      description="Keep track of your compass levels, upgrades and compass stats"
    />
    {sectionFailed ? <MissingData name={'Compass'} failed atZero={tabs[tabIndex] !== 'Upgrade Optimizer'}/> : null}
    {groupedUpgrades?.length ? costSettings : null}
    {windWalkers.length > 1 ? <PageHeaderControl>
      <TextField select value={selectedWindWalker?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {windWalkers.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Wind Walker' }
                   }
                 }}>
        {windWalkers.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{character?.name}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    <PageSummary>
      <StatTile label={'Total levels'} value={shown(formatNum(totalUpgradeLevels ?? 0))}/>
      <StatTile label={'Extra dust'} value={shown(extraDustText)}
                info={sectionFailed ? undefined : 'Not including Spirit Reindeer kills'}
                breakdown={!sectionFailed && extraDust?.breakdown ? { ...extraDust.breakdown, totalValue: extraDustText } : undefined}
                breakdownTitle={'Extra dust'}/>
      <StatTile label={'Total dust collected'} value={shown(formatNum(totalDustsCollected ?? 0, 'whole'))}/>
      <StatTile label={'Exalted stamps'} icon={'etc/Exalted_Stamp_Frame.png'}
                value={shown(`${formatNum(remainingExaltedStamps ?? 0)} / ${formatNum((usedExaltedStamps ?? 0) + (remainingExaltedStamps ?? 0))}`)}/>
      {topOfTheMorninKills || sectionFailed
        ? <StatTile label={'Top of the Mornin\' kills'} value={shown(amountPair(topOfTheMorninKills))}/>
        : null}
      {/* Every dust cost on the Upgrades tab prints in this rule, so the balances do too */}
      {Object.keys(dustNames).map((index) => <StatTile key={index} label={cleanUnderscore(dustNames[index])}
                                                       icon={`data/Dust${index}_x1.png`}
                                                       value={shown(formatGame(dusts?.[index]?.value ?? 0, 'Windwalker.CompassUpgCost', { whole: true }))}/>)}
    </PageSummary>
    <Panel title={'Tempest Form'} meta={formMeta} sx={{ mb: 3 }}>
      <Box sx={FORM_GRID_SX}>
        {tempestRows(tempestStats).map(([label, value]) => <Panel.KV key={label} label={label}
                                                                     value={selectedWindWalker && !sectionFailed ? value : '-'}/>)}
      </Box>
    </Panel>
    <Tabber tabs={tabs}>
      <Upgrades account={state?.account} upgrades={catalog?.groupedUpgrades ?? groupedUpgrades} dusts={dusts} costing={costing}
                sectionFailed={sectionFailed}/>
      <UpgradeOptimizer character={selectedWindWalker} account={state?.account} sectionFailed={sectionFailed}/>
      <Abominations abominations={catalog?.abominations ?? abominations} sectionFailed={sectionFailed}/>
      <Medallions medallions={catalog?.medallions ?? medallions} totalAcquiredMedallions={totalAcquiredMedallions}
                  abominations={catalog?.abominations ?? abominations} sectionFailed={sectionFailed}/>
      <Portals maps={catalog?.maps ?? maps} dusts={dusts} sectionFailed={sectionFailed}/>
    </Tabber>
  </>;
};

export default Compass;
