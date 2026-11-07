import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, fillArrayToLength, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Timer from 'components/common/Timer';
import { NextSeo } from 'next-seo';
import { calcTotalCritters, getShinyChanceInfo, getTrapsBonuses } from '@parsers/world-3/traps';
import { createBreakdown, findBreakdownNode } from '@parsers/breakdown';
import { items as itemsTable } from '@website-data';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';

const itemName = (rawName) => cleanUnderscore(itemsTable?.[rawName]?.displayName ?? rawName);
const trapBoxName = (trapType) => itemName(`TrapBoxSet${(trapType ?? 0) + 1}`);
const critters = (value) => formatGame(value ?? 0, 'TrappingStuffs.TotalQTY', { whole: true });

// A trap's numbers at the collector's rates: the box, its quantity and EXP (or shiny) multis, trap EXP and critters
const trapNote = (slot, collectRate) => <Stack gap={0.5}>
  <Typography variant={'body2'}>{`${slot?.name}: ${trapBoxName(slot?.trapType)}`}</Typography>
  <Typography variant={'body2'}>{`Quantity x${slot?.trapData?.quantity ?? 1}`}</Typography>
  <Typography variant={'body2'}>{`${slot?.trapData?.trapType === 0 ? 'EXP' : 'Shiny'} x${slot?.trapData?.exp ?? 1}`}</Typography>
  <Typography variant={'body2'}>{`Trap EXP ${formatGame((slot?.trapExp ?? 0) * (collectRate?.exp ?? 1), 'TrappingStuffs.TotalEXP')}`}</Typography>
  <Typography variant={'body2'}>{`Critters ${critters((slot?.crittersQuantity ?? 0) * (collectRate?.critter ?? 1))}`}</Typography>
</Stack>;

const Traps = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'traps');
  const traps = state?.account?.traps ?? [];
  const characters = state?.characters ?? [];
  const [selectedChar, setSelectedChar] = useState(null);
  const bonuses = getTrapsBonuses(state?.account, state?.characters);
  const collectRates = bonuses?.perCharacter ?? [];
  // Derived rather than stored: the character list only arrives after mount, so an initial index
  // would pin the page to whoever happened to be first instead of the best collector.
  const bestIndex = collectRates.reduce((best, { critter }, index) => critter > collectRates[best].critter
    ? index
    : best, 0);
  const selectedIndex = characters.findIndex((character) => character?.playerId === selectedChar);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : bestIndex;
  const activeCharacter = characters[activeIndex];
  const collectRate = collectRates[activeIndex] ?? bonuses?.max;
  const totals = calcTotalCritters(state?.account, collectRate ?? {}) ?? {};
  const shiny = getShinyChanceInfo(state?.account, state?.characters, activeCharacter);
  const callMeAshBubble = state?.account?.alchemy?.bubbles?.quicc?.find(({ bubbleName }) => bubbleName === 'CALL_ME_ASH')?.level;
  const plusOneTrap = callMeAshBubble > 0 ? 1 : 0;

  const rateTile = (label, value, key) => {
    const text = `${formatGame((value ?? 1) * 100, key)}%`;
    // The parser's one list holds both rates: each tile opens its own half
    const group = findBreakdownNode(collectRate?.breakdown?.tree ?? [], label);
    return <StatTile label={label} value={text} breakdownTitle={label}
                     breakdown={group?.children ? createBreakdown(label, text, group.children, { combine: 'sum' }) : undefined}/>;
  };
  const shinyText = formatNum(shiny?.multiplier ?? 1, 'mult');

  const trapsPanel = (trapSlots, index) => {
    const character = characters[index];
    const trap = character?.tools?.find(({ Type }) => Type === 'TRAP_BOX_SET');
    const usedTrap = character?.tools?.[4]?.rawName !== 'Blank' ? character?.tools?.[4] : null;
    const maxTraps = Math.min(8, usedTrap
      ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + plusOneTrap
      : trapSlots.length);
    const realTraps = trapSlots.length >= maxTraps ? trapSlots : fillArrayToLength(maxTraps, trapSlots);
    const charTotals = trapSlots.reduce((total, { crittersQuantity, trapExp, rawName }) => ({
      ...total,
      [rawName]: {
        critters: (total?.[rawName]?.critters ?? 0) + (crittersQuantity * (collectRate?.critter ?? 1)),
        exp: (total?.[rawName]?.exp ?? 0) + (trapExp * (collectRate?.exp ?? 1))
      }
    }), {});
    const meta = [`Trapping Lv ${formatNum(character?.skillsInfo?.trapping?.level ?? 0)}`,
      trap?.rawName ? itemName(trap.rawName) : null].filter(Boolean).join(' · ');
    return <Panel key={`traps-${index}`} icon={`data/ClassIcons${character?.classIndex}.png`}
                  title={cleanUnderscore(character?.name) || `Character ${index + 1}`} meta={meta}>
      <Box sx={{ p: 2 }}>
        {realTraps.length ? <CardGrid size={'icon'} fill>{realTraps.map((slot, slotIndex) => slot?.name
            ? <IconTile key={`${slot.rawName}-${slotIndex}`} icon={`data/${slot.rawName}.png`} alt={slot.name}
                        mark={`data/TrapBoxSet${(slot.trapType ?? 0) + 1}.png`} markAlt={trapBoxName(slot.trapType)}
                        value={<Timer type={'countdown'} component={'span'} sx={{ font: 'inherit' }} date={slot.timeLeft}
                                      placeholder={<StatusText status={'ready'}/>}/>}
                        details={trapNote(slot, collectRate)}/>
            : <IconTile key={`empty-${slotIndex}`} status={'empty'}/>)}</CardGrid>
          : <Typography variant={'body2'} color={'text.secondary'}>Equip a trap set to place traps.</Typography>}
      </Box>
      {Object.entries(charTotals).map(([critter, { critters: count, exp }]) => <Panel.Row key={critter}
                                                                                         icon={`data/${critter}.png`}
                                                                                         name={itemName(critter)}
                                                                                         value={critters(count)}
                                                                                         valueSub={`${formatGame(exp, 'TrappingStuffs.TotalEXP')} EXP`}/>)}
    </Panel>;
  };

  return <>
    <NextSeo
      title="Traps | Idleon Toolbox"
      description="Keep track of your traps timing, critters amounts and more"
    />
    {characters.length ? <PageHeaderControl>
      <TextField select value={activeCharacter?.playerId ?? ''} onChange={(event) => setSelectedChar(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Collect as</Box>
                       {characters.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Collect as' }
                   }
                 }}>
        {characters.map((character) => <MenuItem key={character?.playerId} value={character?.playerId}>{cleanUnderscore(character?.name)}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    {sectionFailed ? <MissingData name={'Traps'} failed/> : !characters.length
      ? <Notice tone={'signin'} sx={{ mb: 2 }}>Each character&apos;s traps show here once you sign in.</Notice>
      : null}
    <PageSummary failed={isParseFailed(state?.account)}>
      {rateTile('Critter collect rate', collectRate?.critter, 'TrappingStuffs.CollectAllPCT')}
      {rateTile('EXP collect rate', collectRate?.exp, 'TrappingStuffs.CollectAllPCTexp')}
      <StatTile label={'Shiny chance'} value={shinyText} sub={`${formatNum(shiny?.bundleSize ?? 1)} per drop`}
                breakdownTitle={'Shiny chance'}
                breakdown={shiny?.breakdown ? { ...shiny.breakdown, totalValue: shinyText } : undefined}/>
    </PageSummary>
    {Object.keys(totals).length ? <>
      <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>In your traps</Typography>
      <CardGrid size={'icon'} sx={{ mb: 3 }}>
        {Object.entries(totals).map(([critter, { critters: count }]) => <IconTile key={critter} icon={`data/${critter}.png`}
                                                                                  alt={itemName(critter)} value={critters(count)}
                                                                                  details={`${itemName(critter)}: ${critters(count)} critters`}/>)}
      </CardGrid>
    </> : null}
    <Stack gap={2}>
      {traps.map(trapsPanel)}
    </Stack>
  </>;
};

export default Traps;
