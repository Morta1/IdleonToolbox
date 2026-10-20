import { Autocomplete, Badge, Box, Card, CardContent, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import React, { useContext } from 'react';
import { MonsterIcon } from './styles';
import AutoGrid from '@components/common/AutoGrid';
import { CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';
import Timer from '@components/common/Timer';
import { AppContext } from '@components/common/context/AppProvider';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { BASE_MAX_SHINY_LEVEL, getKillPetTimeSpeed, getTimeToLevel, MAX_BREEDABILITY_LEVEL } from '@parsers/world-4/breeding';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { monsterImage } from '@utility/spriteImages';
import { getMaxDamage } from '@parsers/damage';
import { monsters } from '@website-data';

const checkboxSx = { flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 auto' } };
const killCardSx = { width: 'auto', flex: { xs: '1 1 100%', sm: '0 0 240px' } };
const statCardSx = { width: 'auto', flex: { xs: '1 1 140px', md: '0 0 180px' } };

const WithKillsTime = ({ time, state, variant = 'body2' }) => <Stack direction={'row'} alignItems={'center'} gap={.5}
  sx={{ color: 'success.main' }}>
  <Typography variant={variant}>With kills:</Typography>
  {time < 1000
    ? <Typography variant={variant}>{'<1s'}</Typography>
    : <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
      staticTime
      variant={variant}
      date={new Date().getTime() + time} />}
</Stack>;

const PetCard = ({
  pet,
  isShiny,
  fencePets,
  multi,
  state,
  applyThreshold,
  showAllPets,
  threshold,
  killSpeed
}) => {
  const {
    monsterName,
    monsterRawName,
    icon,
    passive,
    shinyLevel,
    breedingLevel,
    unlocked,
    shinyProgress,
    breedingProgress,
    shinyGoal,
    breedingGoal,
    breedingMultipliers,
    rawPassive
  } = pet;

  const progress = isShiny ? shinyProgress : breedingProgress;
  const level = isShiny ? shinyLevel : breedingLevel;
  const maxShinyLevel = state?.account?.breeding?.maxShinyLevel ?? BASE_MAX_SHINY_LEVEL;
  const maxLevel = isShiny ? maxShinyLevel : MAX_BREEDABILITY_LEVEL;
  const isMaxed = level >= maxLevel;
  if (applyThreshold && level >= threshold) return null;
  const goal = isShiny ? shinyGoal : breedingGoal;
  const fencePet = fencePets[monsterRawName];
  const amount = isShiny ? fencePet?.shiny : fencePet?.breedability;
  if (!showAllPets && !amount) return null;
  const timeLeft = ((goal - progress) / multi.value / amount) * 8.64e+7;
  const bodyIcon = icon?.startsWith('Mface');
  const totalChance = breedingMultipliers?.totalChance > 0.1
    ? `${notateNumber(Math.min(100, 100 * breedingMultipliers?.totalChance), 'Micro')}%`
    : `1 in ${Math.max(1, Math.ceil(1 / breedingMultipliers?.totalChance))}`;
  const targetLevel = applyThreshold ? threshold : 5;
  const timeToThreshold = getTimeToLevel(pet, multi.value, amount, targetLevel, isShiny, maxShinyLevel);


  return <Card variant={'outlined'}
    sx={{
      width: 300,
      opacity: unlocked && level > 0 ? 1 : .6,
      border: amount > 0 && (isShiny ? fencePet?.shiny > 0 : fencePet?.breedability > 0)
        ? '1px solid'
        : '',
      borderColor: isMaxed
        ? 'error.light'
        : amount > 0 && (isShiny ? fencePet?.shiny > 0 : fencePet?.breedability > 0)
          ? 'success.main'
          : ''
    }}>
    <CardContent>
      <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ width: '100%' }}>
        <Badge anchorOrigin={{ vertical: 'top', horizontal: 'left' }} color="primary"
          badgeContent={isShiny && fencePet?.shiny > 0 || !isShiny && fencePet?.breedability > 0
            ? (isShiny ? fencePet?.shiny : fencePet?.breedability) : null}
          sx={{ '& .MuiBadge-badge': { top: 10, left: 5 } }}>
          <MonsterIcon
            src={bodyIcon ? monsterImage(monsterRawName) : `${prefix}data/${icon}.png`}
            missingIcon={bodyIcon}
            alt="" />
        </Badge>
        <Stack sx={{ width: '100%' }} gap={.5}>
          <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
            <Typography variant={'body1'}>{cleanUnderscore(monsterName)}</Typography>
          </Stack>
          <Stack direction={'row'} divider={<Divider orientation={'vertical'} sx={{ mx: 1 }} flexItem />}>
            <Typography variant={'caption'}> Lv. {level}</Typography>
            {!isMaxed && progress < goal ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
              <Typography variant={'caption'}>
                {notateNumber(goal - progress)} Days left
              </Typography>
              <Tooltip title={`${numberWithCommas(goal.toFixed(2).replace('.00', ''))} Days total`}>
                <InfoIcon sx={{ fontSize: 14 }} />
              </Tooltip>
            </Stack> : null}
          </Stack>
          {!isMaxed && (timeLeft || !isShiny) ? <Stack direction="row" alignItems={'center'} gap={1}>
            <Typography variant={'body2'}>Next lv: </Typography>
            <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
              staticTime
              variant={'body2'}
              date={new Date().getTime() + (timeLeft)} />
          </Stack> : <Typography variant={'body2'}>{isMaxed ? 'Maxed!' : '\u00A0'}</Typography>}
          {!isMaxed && Number.isFinite(timeLeft) && timeLeft > 0 && killSpeed ? <WithKillsTime time={timeLeft / killSpeed} state={state} /> : null}
          {!isMaxed && timeToThreshold > 0 && timeLeft && timeToThreshold !== timeLeft ? <>
            <Stack flexWrap={'wrap'} direction={'row'}
              gap={1}>
              <Typography component={'span'} variant={'body2'}>To {targetLevel}:</Typography>
              <Timer variant={'caption'} type={'countdown'} lastUpdated={state?.lastUpdated}
                staticTime
                date={new Date().getTime() + (timeToThreshold)} />
            </Stack>
            {killSpeed ? <WithKillsTime time={timeToThreshold / killSpeed} state={state} variant={'caption'} /> : null}
          </> : null}
          {!isShiny ? <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Typography>Total Chance: {totalChance}</Typography>
            <Tooltip title={<>
              <Typography>Genetic
                Multi: {notateNumber(breedingMultipliers?.first, 'MultiplierInfo')}x</Typography>
              <Typography>Breedable
                Multi: {notateNumber(breedingMultipliers?.second, 'MultiplierInfo')}x</Typography>
              <Typography>Rarity
                Multi: {notateNumber(breedingMultipliers?.third, 'MultiplierInfo')}x</Typography>
              <Typography>Pastpres
                Multi: {notateNumber(breedingMultipliers?.fourth, 'MultiplierInfo')}x</Typography>
              <Typography>Failure
                Multi: {notateNumber(breedingMultipliers?.fifth, 'MultiplierInfo')}x</Typography>
            </>}>
              <InfoIcon fontSize={'small'} />
            </Tooltip>
          </Stack> : null}
        </Stack>
      </Stack>
      {isShiny ? <>
        <Divider sx={{ my: 1 }} />
        <Stack>
          <Typography variant={'body2'}>Shiny Passive:</Typography>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Typography variant={'body2'}>{cleanUnderscore(passive)}</Typography>
            <Tooltip
              title={`Total ${cleanUnderscore(rawPassive).replace(/[{}+]/g, '')}: ${state?.account?.breeding?.passivesTotals?.[rawPassive]}`}>
              <IconInfoCircleFilled size={18} />
            </Tooltip>
          </Stack>
        </Stack>
      </> : null}
    </CardContent>
  </Card>;
};

const Other = ({ pets, fencePets, isShiny, multi, killCharacters }) => {
  const { state } = useContext(AppContext);
  const [Element, showAllPets, setShowAllPets] = useCheckbox('Show all pets', true);
  const [OrderElement, orderByTime] = useCheckbox('Order by time', false);
  const [ThresholdElement, applyThreshold] = useCheckbox('Only below level', false, 'Apply threshold');
  const [GroupElement, groupByStat] = useCheckbox('Group by stat', false);
  const [shinyThreshold, setShinyThreshold] = useLocalStorage({ key: `breeding:shinyLevelThreshold`, defaultValue: 5 });
  const [breedabilityThreshold, setBreedabilityThreshold] = useLocalStorage({
    key: `breeding:breedabilityLevelThreshold`,
    defaultValue: 5
  });
  const [killCharacterName, setKillCharacterName] = useLocalStorage({ key: `breeding:killCharacter` });
  const killPetTimeUnlocked = killCharacters?.length > 0;
  // The game only rolls on monsters (MonsterDefinitions Type "Monster"): trees, ores, fish and bugs never count
  const getKillsPerHour = (character) => monsters?.[character?.targetMonster]?.Type === 'Monster'
    ? getMaxDamage(character, state?.characters, state?.account)?.killsPerHour ?? 0
    : 0;
  // Unset picks the first eligible character; 'none' is an explicit opt-out
  const killCharacter = killCharacterName === 'none'
    ? null
    : killCharacters?.find(({ name }) => name === killCharacterName)
    ?? killCharacters?.find((character) => getKillsPerHour(character) > 0)
    ?? killCharacters?.[0];
  const killsPerHour = getKillsPerHour(killCharacter);
  const killMonsterName = cleanUnderscore(monsters?.[killCharacter?.targetMonster]?.Name ?? '');
  const killSpeed = killsPerHour > 0 ? getKillPetTimeSpeed(killsPerHour) : null;
  const [selectedPassive, setSelectedPassive] = useLocalStorage({
    key: `breeding:selectedPassive`,
    defaultValue: null
  });

  const maxThreshold = isShiny ? (state?.account?.breeding?.maxShinyLevel ?? BASE_MAX_SHINY_LEVEL) : MAX_BREEDABILITY_LEVEL;
  // Stored thresholds can predate the cap (or be typed past it), so clamp on read as well as on write.
  const threshold = Math.max(1, Math.min(maxThreshold, Number(isShiny ? shinyThreshold : breedabilityThreshold) || 1));
  const setThreshold = (value) => {
    const clamped = Math.max(1, Math.min(maxThreshold, Number(value) || 1));
    return isShiny ? setShinyThreshold(clamped) : setBreedabilityThreshold(clamped);
  };

  const uniquePassives = [...new Set(pets.map(pet => cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '')))].sort();

  let hasPetsUnderThreshold = true;
  if (applyThreshold) {
    if (!showAllPets) {
      hasPetsUnderThreshold = pets.some(({ monsterRawName, shinyLevel, breedingLevel, rawPassive }) => {
        if (isShiny && selectedPassive && cleanUnderscore(rawPassive).replace(/[{}+]/g, '') !== selectedPassive) return false;
        const fencePet = fencePets[monsterRawName];
        const amount = isShiny ? fencePet?.shiny : fencePet?.breedability;
        if (!amount) return false;
        if (isShiny && !fencePet?.shiny > 0) return false;
        if (!isShiny && !fencePet?.breedability > 0) return false;
        return (isShiny ? shinyLevel : breedingLevel) < threshold;
      });
    } else {
      hasPetsUnderThreshold = pets.some(({ shinyLevel, breedingLevel, rawPassive }) => {
        if (isShiny && selectedPassive && cleanUnderscore(rawPassive).replace(/[{}+]/g, '') !== selectedPassive) return false;
        return (isShiny ? shinyLevel : breedingLevel) < threshold;
      });
    }
  }

  const mappedPets = pets?.map((pet) => ({
    ...pet,
    timeLeft: isShiny
      ? ((pet?.shinyGoal - pet?.shinyProgress) / multi.value / (fencePets?.[pet?.monsterRawName]?.shiny || 1)) * 8.64e+7
      : ((pet?.breedingGoal - pet?.breedingProgress) / multi.value / (fencePets?.[pet?.monsterRawName]?.breedability || 1)) * 8.64e+7
  }));
  const filteredPets = isShiny && selectedPassive
    ? mappedPets.filter(pet => cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '') === selectedPassive)
    : mappedPets;
  const reorderPets = orderByTime ? filteredPets?.toSorted((a, b) => a?.timeLeft - b?.timeLeft) : filteredPets;

  const groupedPets = (!isShiny || !groupByStat)
    ? reorderPets
    : reorderPets.reduce((acc, pet) => {
      const passive = cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '');
      if (!acc[passive]) {
        acc[passive] = [];
      }
      acc[passive].push(pet);
      return acc;
    }, {});

  const totalLevels = pets.reduce((acc, pet) => (isShiny ? pet.shinyLevel : pet.breedingLevel) + acc, 0)

  return <>
    <Stack mb={3} gap={2}>
      <Stack direction={'row'} flexWrap={'wrap'} alignItems={'flex-start'} gap={2}>
        <CardTitleAndValue title={'Multi'} cardSx={statCardSx} value={<Stack direction={'row'} gap={.5} alignItems={'center'}>
          <Typography variant={'body1'}>{multi?.value >= 1000 ? numberWithCommas(Math.round(multi.value)) : notateNumber(multi?.value, 'MultiplierInfo')}x</Typography>
          <Breakdown data={multi?.breakdown}>
            <Stack alignContent={'center'}>
              <IconInfoCircleFilled size={18} />
            </Stack>
          </Breakdown>
        </Stack>} />
        <CardTitleAndValue title={'Total levels'} cardSx={statCardSx} value={totalLevels} />
        {isShiny ? <CardTitleAndValue title={'Shiny OverLVs'} cardSx={statCardSx} value={<Stack direction={'row'} gap={.5}
          alignItems={'center'}>
          <Typography variant={'body1'}>
            {state?.account?.breeding?.shinyOverLevels ?? 0} ({notateNumber(state?.account?.breeding?.shinyOverLevelMulti ?? 1, 'MultiplierInfo')}x)
          </Typography>
          <Tooltip title={'Each shiny level above 20 is +1 OverLV, which multiplies mob damage and shiny level up rate'}>
            <IconInfoCircleFilled size={18} />
          </Tooltip>
        </Stack>} /> : null}
        {killPetTimeUnlocked ? <CardTitleAndValue title={'With kills'} cardSx={killCardSx} value={<Stack gap={.5}>
          <Stack direction={'row'} gap={.5} alignItems={'center'}>
            <TextField select size={'small'} variant={'standard'} sx={{ minWidth: 170, width: 'fit-content' }}
            value={killCharacter?.name ?? 'none'}
            slotProps={{ htmlInput: { 'aria-label': 'Kills by' } }}
            onChange={(e) => setKillCharacterName(e.target.value)}>
            <MenuItem value={'none'}>None</MenuItem>
            {killCharacters.map((character) => <MenuItem key={character?.name} value={character?.name}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}data/ClassIcons${character?.classIndex}.png`} alt="" width={20} height={20} />
                <Typography variant={'body2'}>{character?.name}</Typography>
              </Stack>
            </MenuItem>)}
          </TextField>
            <Tooltip
              title={'Enhanced Whale Wallop: each monster this character kills has a 50% chance to add 3s to every fenced pet (shiny, breedability, trekking). Only real kills count: multikill and AFK gains add nothing, so this is far below KILLS/HR in AFK info. Assumes nonstop fighting on the current target.'}>
              <IconInfoCircleFilled size={18} />
            </Tooltip>
          </Stack>
          {killCharacter ? <Typography variant={'body1'} sx={{ color: killSpeed ? 'success.main' : 'text.secondary' }}>
            {killSpeed ? `${notateNumber(killSpeed, 'MultiplierInfo')}x faster` : 'No kills'}
          </Typography> : null}
          {killsPerHour > 0 ? <Typography variant={'caption'} color={'text.secondary'}>
            {`${notateNumber(killsPerHour)}/hr${killMonsterName ? ` on ${killMonsterName}` : ''}`}
          </Typography> : null}
        </Stack>} /> : null}
      </Stack>
      <Card variant={'outlined'}>
        <CardContent sx={{ '&:last-child': { py: 1.5 } }}>
          <Stack gap={1.5}>
            <Stack direction={'row'} flexWrap={'wrap'} alignItems={'center'} columnGap={2} rowGap={.5}>
              <Box sx={checkboxSx}><Element checked={showAllPets} /></Box>
              {isShiny && <Box sx={checkboxSx}><GroupElement checked={groupByStat} /></Box>}
              <Box sx={checkboxSx}><OrderElement checked={orderByTime} /></Box>
              <Stack direction={'row'} alignItems={'center'}>
                <ThresholdElement checked={applyThreshold} />
                <TextField size={'small'} sx={{ width: 72 }}
                  type={'number'} value={threshold} disabled={!applyThreshold}
                  slotProps={{ htmlInput: { min: 1, max: maxThreshold, 'aria-label': 'Level threshold' } }}
                  onChange={(e) => setThreshold(e.target.value)} />
                <Tooltip title={isShiny
                  ? `Show shiny pets under this level only (max ${maxThreshold})`
                  : `Show breedability pets under this level only (max ${maxThreshold})`}>
                  <IconInfoCircleFilled size={18} style={{ marginLeft: 4 }} />
                </Tooltip>
              </Stack>
              {isShiny ? <Autocomplete
                size="small"
                options={uniquePassives}
                value={selectedPassive}
                onChange={(_, newValue) => {
                  setSelectedPassive(newValue);
                  setShowAllPets(true);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by passive"
                    placeholder="Any"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 220 }}
                  />
                )}
              /> : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
    {!hasPetsUnderThreshold ? <Typography variant={'h5'}>
      All pets are above the set threshold, increase the threshold to see more pets.
    </Typography> : isShiny && groupByStat ? Object.entries(groupedPets).map(([passive, pets]) => (
      <Stack key={passive} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{passive}</Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {pets.map((pet) => (
            <PetCard
              key={pet.monsterName}
              pet={pet}
              isShiny={isShiny}
              fencePets={fencePets}
              multi={multi}
              state={state}
              applyThreshold={applyThreshold}
              showAllPets={showAllPets}
              threshold={threshold}
              killSpeed={killSpeed}
            />
          ))}
        </Stack>
      </Stack>
    )) : <AutoGrid>
      {reorderPets.map((pet) => (
        <PetCard
          key={pet.monsterName}
          pet={pet}
          isShiny={isShiny}
          fencePets={fencePets}
          multi={multi}
          state={state}
          applyThreshold={applyThreshold}
          showAllPets={showAllPets}
          threshold={threshold}
          killSpeed={killSpeed}
        />
      ))}
    </AutoGrid>}
  </>
};

export default Other;
