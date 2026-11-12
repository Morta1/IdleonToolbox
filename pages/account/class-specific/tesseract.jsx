import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { formatGame } from '@utility/gameNotation';
import {
  getArcanistStats,
  getExtraTachyon,
  getPrismaFragChance,
  getTesseract,
  getTotalTachyonsCollected,
  tachyonNames
} from '@parsers/class-specific/tesseract';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { isParseFailed, isSectionFailed, MissingData } from '@components/common/styles';
import Upgrades from '@components/account/Misc/class-specific/Tesseract/Upgrades';
import Maps from '@components/account/Misc/class-specific/Tesseract/Maps';
import { getDropRate } from '@parsers/character';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Tesseract/UpgradeOptimizer';
import useMasterclassCostControls from '@components/account/Misc/class-specific/useMasterclassCostControls';
import useTabIndex from '@hooks/useTabIndex';
import FormStats from '@components/account/Misc/class-specific/FormStats';

// The Arcanist Form stat panel's rows, in the game's names, each in its game rule (ArcaneType.Arcane_*)
const arcanistRows = (stats) => [
  ['Damage', formatGame(stats?.damage, 'ArcaneType.Arcane_DMG')],
  ['Accuracy', formatGame(stats?.accuracy, 'ArcaneType.Arcane_ACC')],
  ['Defence', formatGame(stats?.defence, 'ArcaneType.Arcane_DEF')],
  // game: mastery is a fraction, the minimum damage share (0.25 = 25%)
  ['Mastery', formatNum(100 * (stats?.mastery ?? 0), 'pct')],
  ['Crit chance', `${formatGame(stats?.critPct, 'ArcaneType.Arcane_CRITPCT')}%`],
  ['Crit damage', `${formatGame(stats?.critDamage, 'ArcaneType.Arcane_CRITDMG')}x`],
  // The game's stat panel prints 100 plus the bonus.
  ['Attack speed', `${formatGame(100 + (stats?.attackSpeed ?? 0), 'ArcaneType.Arcane_AttackSpdPCT')}%`]
];
// One to three columns of rows, as wide as the page allows
// A failed section's catalog at zero, from the parser's own empty save: every upgrade by name
const zeroTesseract = () => {
  try {
    return getTesseract({}, [], {});
  }
  catch {
    return {};
  }
};

const Tesseract = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['class-specific'].categories, 'tesseract');
  const [tabIndex] = useTabIndex(tabs);
  const sectionFailed = isSectionFailed(state?.account, 'tesseract');
  const { upgrades, totalUpgradeLevels, tachyons } = state?.account?.tesseract || {};
  // game ArcaneUpgUNLOCKED: an upgrade opens once the total levels reach its x6, as Grimoire's next upgrade tile reads
  const nextUnlock = (upgrades ?? []).find(({ unlocked }) => !unlocked);
  const catalog = sectionFailed ? zeroTesseract() : null;
  // Remembered per page; no default, so a pick that was never made keeps following the first Arcane Cultist
  const [selectedChar, setSelectedChar] = useLocalStorage({ key: 'tesseract:selectedChar' });
  const arcanists = (state?.characters ?? []).filter((character) => checkCharClass(character?.class, CLASSES.Arcane_Cultist));
  const selectedArcanist = arcanists.find((character) => character?.playerId === selectedChar) ?? arcanists[0];
  const arcanistStats = getArcanistStats(upgrades, totalUpgradeLevels, selectedArcanist, state?.account);
  const dropRate = selectedArcanist ? getDropRate(selectedArcanist, state?.account, state?.characters) : null;
  // The game reads the active character's drop rate, so the chance (and the Prisma sentence's fill) is an Arcane
  // Cultist's: with none there is no number
  const prismaChance = selectedArcanist ? getPrismaFragChance({ ...selectedArcanist, dropRate }, state?.account, upgrades) : undefined;
  const extraTachyon = getExtraTachyon(selectedArcanist, state?.account);
  const totalTachyonsCollected = getTotalTachyonsCollected(state?.account);
  // Levels ahead and the Daily Shopping Spree price the Upgrades tab: in the page's gear, under the tab's name
  const { gear: costSettings, ...costing } = useMasterclassCostControls(state?.account, 'tesseract');
  // The drawer is named and headed as the tile reads
  const extraTachyonText = `${formatGame(extraTachyon?.value ?? 1, 'ArcaneType.ExtraTachyon')}x`;
  // The game's own "1 in N" (its Prisma sentence prints the same)
  const prismaText = prismaChance > 0 ? `1 in ${formatGame(1 / prismaChance, 'ArcaneType.PrismaBubDropChance', { whole: true })}` : '-';
  // A tile the failed section feeds shows no number
  const shown = (value) => (sectionFailed ? '-' : value);
  const formMeta = selectedArcanist?.name
    ?? (state?.emptyAccount ? 'Sign in to see your Arcane Cultist' : isParseFailed(state?.account) ? undefined : 'No Arcane Cultist on this account');

  return <>
    <NextSeo
      title="Tesseract | Idleon Toolbox"
      description="Keep track of your tesseract upgrades, tachyons and arcanist stats"
    />
    {sectionFailed ? <MissingData name={'Tesseract'} failed atZero={tabs[tabIndex] !== 'Upgrade Optimizer'}/> : null}
    {upgrades?.length ? costSettings : null}
    {arcanists.length > 1 ? <PageHeaderControl>
      <TextField select value={selectedArcanist?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {arcanists.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Arcane Cultist' }
                   }
                 }}>
        {arcanists.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{cleanUnderscore(character?.name)}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    <PageSummary>
      <StatTile label={'Total levels'} value={shown(formatNum(totalUpgradeLevels ?? 0))}/>
      <StatTile label={'Total tachyons collected'} value={shown(formatNum(totalTachyonsCollected ?? 0, 'whole'))}/>
      <StatTile label={'Prisma chance'} value={shown(prismaText)}/>
      <StatTile label={'Extra tachyon'} value={shown(extraTachyonText)} breakdownTitle={'Extra tachyon'}
                breakdown={!sectionFailed && extraTachyon?.breakdown ? { ...extraTachyon.breakdown, totalValue: extraTachyonText } : undefined}/>
      {!sectionFailed && nextUnlock?.name ? <StatTile label={'Next upgrade'} value={cleanUpgradeName(nextUnlock.name)}
                                                      sub={`At ${formatNum(nextUnlock.x6)} total ${nextUnlock.x6 === 1 ? 'level' : 'levels'}`}
                                                      info={cleanUnderscore(nextUnlock.description ?? '')}/> : null}
      {/* Every tachyon cost on the Upgrades tab prints in this rule, so the balances do too */}
      {Object.keys(tachyonNames).map((index) => <StatTile key={index} label={tachyonNames[index]} icon={`data/Tach${index}_x1.png`}
                                                          value={shown(formatGame(tachyons?.[index]?.value ?? 0, 'ArcaneType.ArcaneUpgCost', { whole: true }))}/>)}
    </PageSummary>
    <FormStats title={'Arcanist Form'} meta={formMeta} rows={arcanistRows(arcanistStats)} shown={Boolean(selectedArcanist && !sectionFailed)}/>
    <Tabber tabs={tabs}>
      <Upgrades account={state?.account} upgrades={catalog?.upgrades ?? upgrades} tachyons={tachyons} costing={costing}
                prismaChance={sectionFailed ? undefined : prismaChance} character={sectionFailed ? undefined : selectedArcanist} sectionFailed={sectionFailed}/>
      <UpgradeOptimizer account={state?.account} character={selectedArcanist} sectionFailed={sectionFailed}/>
      <Maps account={state?.account} character={selectedArcanist} characters={state?.characters} sectionFailed={sectionFailed}
            extraTachyon={sectionFailed ? null : extraTachyon?.value}/>
    </Tabber>
  </>
};

export default Tesseract;
