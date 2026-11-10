import React, { useContext } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';
import { getCoralKidUpgCost } from '@parsers/world-7/coralReef';
import { LevelsAheadCaption, LevelsAheadSetting, sumLevelCosts } from '@components/common/LevelsAhead';
import PageSettings from '@components/common/PageSettings';
import { calcTotalItemOwned } from '@parsers/storage';
import { getTotalDivinityLevel } from '@parsers/world-5/divinity';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import Notice from '@components/common/Notice';
import GameIcon from '@components/common/GameIcon';

// Menagerie unlock 2 opens Singularity Mode, the second page of Coral Kid upgrades
const SINGULARITY_MENAGERIE_UNLOCK = 2;
const SINGULARITY_SPIRAL = 'CKsing';
// Every Coral Kid cost is Thingies.CoralKidUpgCost (Big), so what pays for it reads in the same rule
const COST_RULE = 'Thingies.CoralKidUpgCost';

// Levels ahead prices this tab only: in the Divinity gear, under the tab's name
export const CORAL_KID_SETTINGS = { levelsAhead: null };

export const CoralKidSettings = () => <PageSettings.Group title={'Coral Kid Upgrades'}>
  <LevelsAheadSetting/>
</PageSettings.Group>;

const formatCost = (value) => formatGame(value, COST_RULE, { whole: true });

const UpgradeGrid = ({ upgrades, locked, totalDivinityLevel, divinityPoints, spiralsOwned, levelsAhead }) => <CardGrid size={'m'}>
  {upgrades.map((upgrade) => {
    const level = upgrade.level ?? 0;
    const owned = (upgrade.costItem ? spiralsOwned : divinityPoints) ?? 0;
    const gateMet = totalDivinityLevel >= (upgrade.divinityLevelReq ?? 0);
    // Page 1 spends Divinity PTS, which has no sprite, so the row names the currency
    const currency = upgrade.costItem ? 'Singularity Spirals' : 'Divinity PTS';
    return <ItemCard key={upgrade.index} level={{ value: upgrade.level ?? 0 }} dimmed={locked || !(upgrade.level > 0)}
                     footer={upgrade.cost !== undefined ? <>
                       <ItemCard.Facts rows={[[currency,
                         <ItemCard.Cost key={'cost'} icon={upgrade.costItem ? `data/${upgrade.costItem}.png` : undefined}
                                        iconAlt={upgrade.costItem ? 'Singularity Spirals' : ''} need={upgrade.cost}
                                        have={owned} game={COST_RULE}/>]]}/>
                       {levelsAhead > 1
                         ? <LevelsAheadCaption targetLevel={formatNum(level + levelsAhead)} owned={owned} format={formatCost} indent={0}
                                               targetCost={sumLevelCosts((at) => getCoralKidUpgCost(upgrade.index, at), level, level + levelsAhead)}/>
                         : null}
                     </> : null}>
      {upgrade.description ? <ItemCard.Desc text={upgrade.description}/> : null}
      {upgrade.divinityLevelReq > 0 ? <ItemCard.Facts rows={[['Needs total Divinity LV', gateMet
        ? formatNum(upgrade.divinityLevelReq)
        : <StatusText key={'gate'} status={'needs'}>{formatNum(upgrade.divinityLevelReq)}</StatusText>]]}/> : null}
    </ItemCard>;
  })}
</CardGrid>;

// The Singularity panel's conversion: Divinity PTS, kills and AFK hours into Singularity Spirals
const Singularity = ({ singularity, spiralsOwned }) => {
  const { points, kills, hours, baseValue, killMulti, timeMulti, totalValue } = singularity ?? {};
  return <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
    <StatTile label={'Singularity Spirals'} icon={`data/${SINGULARITY_SPIRAL}.png`} value={formatGame(spiralsOwned ?? 0, COST_RULE, { whole: true })}/>
    <StatTile label={'Divinity PTS'} value={`${formatGame(points ?? 0, COST_RULE, { whole: true })} (base ${formatGame(baseValue ?? 0, COST_RULE, { whole: true })})`}/>
    <StatTile label={'Kills'} value={kills ?? 0} kind={'amount'} sub={formatNum(killMulti ?? 1, 'mult')}/>
    <StatTile label={'Hours'} value={hours ?? 0} kind={'amount'} sub={formatNum(timeMulti ?? 0, 'mult')}/>
    <StatTile label={'Spirals on claim'} icon={`data/${SINGULARITY_SPIRAL}.png`}
              value={formatGame(Math.floor(totalValue ?? 0), COST_RULE, { whole: true })}/>
  </Stack>;
};

const CoralKidUpgrades = ({ coralKidUpgrades, levelsAhead = 1 }) => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'coralReef');
  const upgrades = coralKidUpgrades ?? [];
  const totalLevels = state?.account?.coralReef?.coralKidUpgradeLevelTotal ?? 0;
  // The gates read the Total Divinity LV across all players (the page's Summary)
  const totalDivinityLevel = getTotalDivinityLevel(state?.characters);
  const divinityPoints = state?.account?.divinity?.divinityPoints;
  const spiralsOwned = calcTotalItemOwned(state?.account?.storage, state?.characters, SINGULARITY_SPIRAL);
  const firstPage = upgrades.length ? Math.min(...upgrades.map(({ page }) => page ?? 0)) : 0;
  const pageOne = upgrades.filter(({ page }) => (page ?? 0) === firstPage);
  const pageTwo = upgrades.filter(({ page }) => (page ?? 0) !== firstPage);
  const singularityUnlocked = isMenagerieUnlockOwned(state?.account, SINGULARITY_MENAGERIE_UNLOCK);

  return <Box>
    {failed ? <MissingData name={'Coral Kid upgrades'} failed atZero={upgrades.length > 0}/> : null}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Total upgrade LV'} value={totalLevels} kind={'amount'}/>
    </Stack>
    <UpgradeGrid upgrades={pageOne} totalDivinityLevel={totalDivinityLevel} divinityPoints={divinityPoints}
                 spiralsOwned={spiralsOwned} levelsAhead={levelsAhead}/>
    {pageTwo.length > 0 ? <>
      <Stack direction={'row'} alignItems={'center'} gap={1} mt={4} mb={2}>
        <GameIcon src={`data/${SINGULARITY_SPIRAL}.png`} size={24} alt={''}/>
        <Typography variant={'sectionTitle'} component={'h2'}>Singularity Mode</Typography>
      </Stack>
      {!singularityUnlocked
        ? <Notice tone={'locked'} sx={{ mb: 2 }}>Singularity Mode unlocks from the Luminous Menagerie.</Notice>
        : <Singularity singularity={state?.account?.coralReef?.singularity} spiralsOwned={spiralsOwned}/>}
      <UpgradeGrid upgrades={pageTwo} locked={!singularityUnlocked} totalDivinityLevel={totalDivinityLevel}
                   divinityPoints={divinityPoints} spiralsOwned={spiralsOwned} levelsAhead={levelsAhead}/>
    </> : null}
  </Box>;
};

export default CoralKidUpgrades;
