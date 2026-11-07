import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React, { useContext } from 'react';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { Duration } from '@components/common/Num';
import { AppContext } from '@components/common/context/AppProvider';
import {
  BASE_MAX_SHINY_LEVEL,
  getTimeToLevel,
  MAX_BREEDABILITY_LEVEL,
  PET_SECONDS_PER_KILL
} from '@parsers/world-4/breeding';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { monsterSprite } from '@utility/spriteImages';

const MOBS_TOOLBAR = { fenced: false, below: 'all', passive: 'any', sort: null, view: 'cards' };

// A pet's face sprite is the monster's own art (monsterSprite); any other icon is a data sprite
export const petIcon = ({ icon, monsterRawName } = {}) => icon?.startsWith('Mface')
  ? monsterSprite(monsterRawName)
  : `data/${icon}.png`;

const levelOf = (pet, isShiny) => (isShiny ? pet?.shinyLevel : pet?.breedingLevel) ?? 0;
// The passive's words without its number slot: "+{%_Drop_Rate" is "% Drop Rate"
const passiveOf = (pet) => cleanUnderscore(pet?.rawPassive).replace(/[{}+]/g, '').trim();
const fenceOf = (fencePets, pet, isShiny) => {
  const fencePet = fencePets?.[pet?.monsterRawName];
  return (isShiny ? fencePet?.shiny : fencePet?.breedability) ?? 0;
};

// The breedability chance's five factors (a hover list today), opened from the chance, their product
const BREEDING_MULTIS = [['Genetic multi', 'Breeding.1stMulti', 'first'], ['Breedable multi', 'Breeding.2ndMulti', 'second'],
  ['Rarity multi', 'Breeding.3rdMulti', 'third'], ['Pastpres multi', 'Breeding.4thMulti', 'fourth'],
  ['Failure multi', 'Breeding.5thMulti', 'fifth']];

const petCard = (pet, { isShiny, fencePets, multi, breeding, targetLevel }) => {
  const {
    monsterName,
    unlocked,
    shinyProgress,
    breedingProgress,
    shinyGoal,
    breedingGoal,
    breedingMultipliers,
    passive,
    rawPassive
  } = pet;
  const progress = isShiny ? shinyProgress : breedingProgress;
  const level = levelOf(pet, isShiny);
  const maxShinyLevel = breeding?.maxShinyLevel ?? BASE_MAX_SHINY_LEVEL;
  const maxLevel = isShiny ? maxShinyLevel : MAX_BREEDABILITY_LEVEL;
  const isMaxed = level >= maxLevel;
  const goal = isShiny ? shinyGoal : breedingGoal;
  const onFence = fenceOf(fencePets, pet, isShiny);
  // A pet off the fence gains nothing, so it has no time to a level
  const timeLeft = onFence > 0 ? ((goal - progress) / (multi?.value ?? 1) / onFence) * 8.64e+7 : NaN;
  const timeToThreshold = getTimeToLevel(pet, multi?.value ?? 1, onFence || undefined, targetLevel, isShiny, maxShinyLevel);
  const chance = breedingMultipliers?.totalChance ?? 0;
  const chanceText = chance > 0.1
    ? `${formatGame(Math.min(100, 100 * chance), 'Breeding.TotalBreedChance')}%`
    : formatNum(chance, 'odds');
  const multis = isShiny ? undefined : createBreakdown('Total chance', chanceText, flatLines(BREEDING_MULTIS
    .map(([name, key, field]) => ({
      name, value: breedingMultipliers?.[field] ?? 1, formatted: `${formatGame(breedingMultipliers?.[field] ?? 1, key)}x`
    }))), { combine: 'list' });
  const passiveTotal = breeding?.passivesTotals?.[rawPassive];

  return <ItemCard key={monsterName} icon={petIcon(pet)} iconAlt={''} title={cleanUnderscore(monsterName)}
                   level={{ value: level, max: maxLevel }} dimmed={!(unlocked && level > 0)}
                   status={isMaxed ? 'maxed' : onFence > 0 ? 'active' : undefined}
                   statusLabel={!isMaxed && onFence > 0 ? `${formatNum(onFence)} on the fence` : undefined}>
    {!isMaxed && progress < goal ? <ItemCard.Progress label={'Days'} value={progress ?? 0} max={goal ?? 0}/> : null}
    <ItemCard.Facts rows={[
      !isMaxed && Number.isFinite(timeLeft) ? ['Next level', <Duration key={'next'} seconds={timeLeft / 1000}/>] : null,
      !isMaxed && timeToThreshold > 0 && Number.isFinite(timeLeft) && timeToThreshold !== timeLeft
        ? [`To Lv ${formatNum(targetLevel)}`, <Duration key={'to'} seconds={timeToThreshold / 1000}/>] : null,
      !isShiny ? ['Total chance', <Breakdown key={'chance'} asValue title={'Total chance'} data={multis}>{chanceText}</Breakdown>] : null,
      isShiny ? ['Shiny passive', cleanUnderscore(passive)] : null,
      isShiny && passiveTotal != null ? ['All pets', cleanUnderscore(rawPassive?.replace('{', formatNum(passiveTotal)))] : null
    ]}/>
  </ItemCard>;
};

// In a failed section the tiles fed by it read "-" (the kill time is the characters')
const Other = ({ pets, fencePets, isShiny, multi, killPetTimeUnlocked, sectionFailed }) => {
  const { state } = useContext(AppContext);
  const breeding = state?.account?.breeding;
  const list = pets ?? [];
  const [toolbar, setToolbar, resetToolbar] = useToolbarState(isShiny ? 'breeding-shinies' : 'breeding-breedability', MOBS_TOOLBAR);

  const maxThreshold = isShiny ? (breeding?.maxShinyLevel ?? BASE_MAX_SHINY_LEVEL) : MAX_BREEDABILITY_LEVEL;
  const levels = Array.from({ length: maxThreshold }, (_, index) => index + 1);
  const passives = [...new Set(list.map(passiveOf))].sort();
  const below = toolbar.below === 'all' ? null : Number(toolbar.below);
  const targetLevel = below ?? 5;

  const shown = list
    .filter((pet) => !toolbar.fenced || fenceOf(fencePets, pet, isShiny) > 0)
    .filter((pet) => below == null || levelOf(pet, isShiny) < below)
    .filter((pet) => !isShiny || toolbar.passive === 'any' || passiveOf(pet) === toolbar.passive);
  // The sort's time counts one copy for a pet off the fence, as before
  const timeLeft = (pet) => ((isShiny ? pet?.shinyGoal - pet?.shinyProgress : pet?.breedingGoal - pet?.breedingProgress)
    / (multi?.value ?? 1) / (fenceOf(fencePets, pet, isShiny) || 1)) * 8.64e+7;
  const sorted = toolbar.sort?.key === 'time' ? shown.toSorted((a, b) => timeLeft(a) - timeLeft(b)) : shown;
  const ordered = toolbar.sort?.order === 'desc' ? sorted.toReversed() : sorted;
  const cardOptions = { isShiny, fencePets, multi, breeding, targetLevel };
  const groups = isShiny && toolbar.view === 'grouped'
    ? passives.map((passive) => [passive, ordered.filter((pet) => passiveOf(pet) === passive)]).filter(([, group]) => group.length)
    : null;

  const totalLevels = list.reduce((acc, pet) => levelOf(pet, isShiny) + acc, 0);
  const multiName = isShiny ? 'Shiny multi' : 'Breedability multi';
  const multiText = formatNum(multi?.value ?? 1, 'mult');

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={multiName} value={sectionFailed ? '-' : multiText} breakdownTitle={multiName}
                breakdown={multi?.breakdown && !sectionFailed ? { ...multi.breakdown, totalValue: multiText } : undefined}/>
      <StatTile label={'Total levels'} value={sectionFailed ? '-' : totalLevels} kind={'amount'}/>
      {isShiny ? <StatTile label={'Shiny OverLVs'} value={sectionFailed ? '-' : breeding?.shinyOverLevels ?? 0} kind={'amount'}
                           sub={sectionFailed ? undefined : `${formatGame(breeding?.shinyOverLevelMulti ?? 1, 'Breeding.SpecialzOverLVL')}x`}
                           info={'Each shiny level above 20 is one OverLV, which multiplies mob damage and the shiny level up rate.'}/> : null}
      {killPetTimeUnlocked ? <StatTile label={'Pet time per kill'} value={`+${PET_SECONDS_PER_KILL}s`}
                                       info={'Enhanced Whale Wallop: every monster you kill has a 50% chance to add 3s to all fenced pets (shiny, breedability and trekking). Only real kills while playing count, crystals and other spawned mobs included. Multikill and AFK gains add nothing.'}/> : null}
    </Stack>
    <Box>
      {sectionFailed ? null : <Toolbar state={toolbar} defaults={MOBS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={list.length} shown={shown.length} noun={'mobs'}>
        <Toolbar.Filter name={'fenced'} label={'On the fence'}/>
        <Toolbar.Show name={'below'} label={'Level'} options={[['all', 'Every level', list.length],
          ...levels.map((level) => [String(level), `Below Lv ${level}`, list.filter((pet) => levelOf(pet, isShiny) < level).length])]}/>
        {isShiny ? <Toolbar.Show name={'passive'} label={'Passive'} options={[['any', 'Any passive', list.length],
          ...passives.map((passive) => [passive, passive, list.filter((pet) => passiveOf(pet) === passive).length])]}/> : null}
        <Toolbar.Sort options={[['time', 'Time to next level', 'asc']]}/>
        {isShiny ? <Toolbar.View options={[['cards', 'All'], ['grouped', 'By passive']]}/> : null}
      </Toolbar>}
      {groups ? groups.map(([passive, group]) => <Stack key={passive} gap={1} sx={{ mb: 3 }}>
        <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>{passive}</Typography>
        <CardGrid size={'m'}>{group.map((pet) => petCard(pet, cardOptions))}</CardGrid>
      </Stack>) : <CardGrid size={'m'}>{ordered.map((pet) => petCard(pet, cardOptions))}</CardGrid>}
    </Box>
  </>
};

export default Other;
