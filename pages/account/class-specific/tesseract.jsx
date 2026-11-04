import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { AppContext } from '@components/common/context/AppProvider';
import { formatNum, getTabs } from '@utility/helpers';
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
import Panel from '@components/common/cards/Panel';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { isSectionFailed, MissingData } from '@components/common/styles';
import Upgrades from '@components/account/Misc/class-specific/Tesseract/Upgrades';
import Maps from '@components/account/Misc/class-specific/Tesseract/Maps';
import { getDropRate } from '@parsers/character';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Tesseract/UpgradeOptimizer';
import useMasterclassCostControls from '@components/account/Misc/class-specific/useMasterclassCostControls';

// The Arcanist Form stat panel's rows, in the game's names, each in its game rule (ArcaneType.Arcane_*)
const arcanistRows = (stats) => [
  ['Damage', formatGame(stats?.damage, 'ArcaneType.Arcane_DMG')],
  ['Accuracy', formatGame(stats?.accuracy, 'ArcaneType.Arcane_ACC')],
  ['Defence', formatGame(stats?.defence, 'ArcaneType.Arcane_DEF')],
  ['Mastery', formatNum(stats?.mastery, 'pct')],
  ['Crit chance', `${formatGame(stats?.critPct, 'ArcaneType.Arcane_CRITPCT')}%`],
  ['Crit damage', `${formatGame(stats?.critDamage, 'ArcaneType.Arcane_CRITDMG')}x`],
  // The game's stat panel prints 100 plus the bonus.
  ['Attack speed', `${formatGame(100 + (stats?.attackSpeed ?? 0), 'ArcaneType.Arcane_AttackSpdPCT')}%`]
];
// One to three columns of rows, as wide as the page allows
const FORM_GRID_SX = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, py: 0.5 };
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
  const sectionFailed = isSectionFailed(state?.account, 'tesseract');
  const { upgrades, totalUpgradeLevels, tachyons } = state?.account?.tesseract || {};
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
  const prismaText = prismaChance > 0 ? `1 in ${formatGame(1 / prismaChance, 'ArcaneType.PrismaBubDropChance')}` : '-';
  // A tile the failed section feeds shows no number
  const shown = (value) => (sectionFailed ? '-' : value);
  const formMeta = selectedArcanist?.name
    ?? (state?.emptyAccount ? 'Sign in to see your Arcane Cultist' : 'No Arcane Cultist on this account');

  return <>
    <NextSeo
      title="Tesseract | Idleon Toolbox"
      description="Keep track of your tesseract upgrades, tachyons and arcanist stats"
    />
    {sectionFailed ? <MissingData name={'Tesseract'} failed/> : null}
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
        {arcanists.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{character?.name}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    <PageSummary>
      <StatTile label={'Total levels'} value={shown(formatNum(totalUpgradeLevels ?? 0))}/>
      <StatTile label={'Total tachyons collected'} value={shown(formatNum(totalTachyonsCollected ?? 0))}/>
      <StatTile label={'Prisma chance'} value={shown(prismaText)}/>
      <StatTile label={'Extra tachyon'} value={shown(extraTachyonText)} breakdownTitle={'Extra tachyon'}
                breakdown={!sectionFailed && extraTachyon?.breakdown ? { ...extraTachyon.breakdown, totalValue: extraTachyonText } : undefined}/>
      {/* Every tachyon cost on the Upgrades tab prints in this rule, so the balances do too */}
      {Object.keys(tachyonNames).map((index) => <StatTile key={index} label={tachyonNames[index]} icon={`data/Tach${index}_x1.png`}
                                                          value={shown(formatGame(tachyons?.[index]?.value ?? 0, 'ArcaneType.ArcaneUpgCost'))}/>)}
    </PageSummary>
    <Panel title={'Arcanist Form'} meta={formMeta} sx={{ mb: 3 }}>
      <Box sx={FORM_GRID_SX}>
        {arcanistRows(arcanistStats).map(([label, value]) => <Panel.KV key={label} label={label}
                                                                       value={selectedArcanist && !sectionFailed ? value : '-'}/>)}
      </Box>
    </Panel>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'tesseract')}>
      <Upgrades account={state?.account} upgrades={catalog?.upgrades ?? upgrades} tachyons={tachyons} costing={costing}
                prismaChance={sectionFailed ? undefined : prismaChance} sectionFailed={sectionFailed}/>
      <UpgradeOptimizer account={state?.account} character={selectedArcanist} sectionFailed={sectionFailed}/>
      <Maps account={state?.account} character={selectedArcanist} characters={state?.characters} sectionFailed={sectionFailed}/>
    </Tabber>
  </>
};

export default Tesseract;
