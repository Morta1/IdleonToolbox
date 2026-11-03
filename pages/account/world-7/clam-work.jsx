import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Box, MenuItem, TextField } from '@mui/material';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World7/ClamWork/Upgrades';
import Compensations from '@components/account/Worlds/World7/ClamWork/Compensations';
import Scurge from '@components/account/Worlds/World7/ClamWork/Scurge';
import UpgradeOptimizer from '@components/account/Worlds/World7/ClamWork/UpgradeOptimizer';
import ScurgeOptimizer from '@components/account/Worlds/World7/ClamWork/ScurgeOptimizer';
import { DEFAULT_CLAM_MULTIKILL, getClamHp, parseClamWork } from '@parsers/world-7/clamWork';
import { getClamworksMultiKill, getMaxDamage } from '@parsers/damage';
import { useLocalStorage } from '@mantine/hooks';

const CLAMWORKS_MAP_INDEX = 306;
const CLAM_SETTINGS = { multiKill: null };

const ClamWork = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const characters = state?.characters;
  const [selectedChar, setSelectedChar] = useLocalStorage({
    key: 'clamWork:selectedChar',
    defaultValue: null
  });
  const [settings, setSettings, resetSettings] = usePageSettings('clam-work', CLAM_SETTINGS);
  const section = account?.clamWork;
  const sectionFailed = isSectionFailed(account, 'clamWork');
  // The page re-runs the parser for the multikill it shows: a section that failed to parse would fail here too
  const parsed = Boolean(section) && !sectionFailed;

  // Default to whoever is parked at the Clamworks, since that is the character the game reads
  // multikill from for MULTI-SCALPING.
  const character = characters?.find((char) => char?.playerId === selectedChar)
    ?? characters?.find((char) => char?.mapIndex === CLAMWORKS_MAP_INDEX)
    ?? characters?.[0];

  const workerClass = section?.workerClass ?? 0;
  const playerInfo = character && parsed ? getMaxDamage(character, characters, account) : null;
  const suggestedMultiKill = playerInfo
    ? getClamworksMultiKill(character, characters, account, getClamHp(workerClass), playerInfo.maxDamage)
    : DEFAULT_CLAM_MULTIKILL;
  const multiKill = settings?.multiKill ?? suggestedMultiKill;
  const clam = parsed ? parseClamWork(account, null, multiKill) : {};
  const {
    promotionChance,
    promotionCost,
    clamHp,
    mobs,
    pearlValue,
    blackPearlValue,
    upgrades,
    ownedPearls,
    compensations,
    scurge,
    respawn
  } = clam;

  // The optimizer walks account.clamWork.upgrades, so it has to see the multikill-aware levels too.
  const optimizerAccount = { ...account, clamWork: { ...section, upgrades, scurge } };

  return <>
    <NextSeo
      title="Clam Work | Idleon Toolbox"
      description="Track your Clam Work upgrade levels, pearl bonuses, and progression in Legends of Idleon World 7"
    />
    {characters?.length ? <PageHeaderControl>
      <TextField select value={character?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {characters?.find((char) => char?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Clamworks character' }
                   }
                 }}>
        {characters?.map((char) => <MenuItem key={char?.playerId} value={char?.playerId}>{char?.name}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    <PageSettings state={settings} defaults={CLAM_SETTINGS} onChange={setSettings} onReset={resetSettings}>
      <PageSettings.Number name={'multiKill'} label={'Multikill'} defaultValue={suggestedMultiKill} min={0} integer
                           help={`MULTI-SCALPING reads the multikill of the character at the Clamworks: ${formatNum(suggestedMultiKill)} for ${character?.name ?? 'your first character'}. Type the number the game shows there to use it instead.`}/>
    </PageSettings>
    {!section || sectionFailed ? <MissingData name={'Clam Work'} failed={sectionFailed}/> : null}
    <PageSummary>
      <StatTile label={'Worker class'} value={formatNum(workerClass, 'level')}/>
      {/* Every pearl cost prints in this rule (Thingies.Clam_Cost), so the balance does too */}
      <StatTile label={'Pearls'} icon={'data/ClamPearl0.png'}
                value={<Num value={ownedPearls ?? 0} game={'Thingies.Clam_Cost'}/>}/>
      <StatTile label={'Promotion chance'} value={(promotionChance ?? 0) * 100} kind={'pct'}/>
      <StatTile label={'Promotion cost'} value={formatGame(promotionCost ?? 0, 'Thingies.Clam_Cost')}/>
      <StatTile label={'Pearl value multiplier'} value={formatGame(pearlValue ?? 1, 'Thingies.ClamPearlValue')}/>
      <StatTile label={'Black pearl value'} value={formatGame(blackPearlValue ?? 50, 'Thingies.Clam_BlackPearlValue')}/>
      <StatTile label={'Clam mobs'} value={formatGame(mobs ?? 0, 'Thingies.Clam_Mobs')}/>
      <StatTile label={'Clam HP'} value={clamHp ?? 0} kind={'amount'}/>
      <StatTile label={'Respawn time'} value={`${formatNum(respawn ?? 60)}s`}/>
      {/* Phase 4's Summary line for a setting that changes what the numbers mean */}
      <StatTile label={'Multikill'} value={formatNum(multiKill)}
                sub={settings?.multiKill != null ? `Yours, auto ${formatNum(suggestedMultiKill)}` : 'Auto'}
                info={'MULTI-SCALPING scales with the multikill of the character farming the Clamworks. Page settings takes the number the game shows there.'}/>
    </PageSummary>
    <Tabber tabs={['Upgrades', 'Upgrade Optimizer', 'Scurge', 'Scurge Optimizer', 'Compensations']}>
      <Upgrades upgrades={upgrades} ownedPearls={ownedPearls ?? 0}/>
      <UpgradeOptimizer character={character} account={optimizerAccount} multiKill={multiKill}/>
      <Scurge scurge={scurge}/>
      <ScurgeOptimizer character={character} account={optimizerAccount} multiKill={multiKill}/>
      <Compensations compensations={compensations}/>
    </Tabber>
  </>;
};

export default ClamWork;
