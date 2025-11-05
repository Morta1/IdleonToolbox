import { Autocomplete, Badge, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import React, { useContext, useMemo } from 'react';
import { MonsterIcon } from './styles';
import AutoGrid from '@components/common/AutoGrid';
import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';
import Timer from '@components/common/Timer';
import { AppContext } from '@components/common/context/AppProvider';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { getTimeToLevel } from '@parsers/breeding';

const PetCard = ({
                   pet,
                   isShiny,
                   fencePets,
                   multi,
                   state,
                   applyThreshold,
                   showAllPets,
                   shinyThreshold,
                   breedabilityThreshold
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
  const currentThreshold = isShiny ? shinyThreshold : breedabilityThreshold;
  if (applyThreshold && level >= currentThreshold) return null;
  const goal = isShiny ? shinyGoal : breedingGoal;
  const fencePet = fencePets[monsterRawName];
  const amount = isShiny ? fencePet?.shiny : fencePet?.breedability;
  if (!showAllPets && !amount) return null;
  const timeLeft = ((goal - progress) / multi.value / amount) * 8.64e+7;
  const missingIcon = (icon === 'Mface23' || icon === 'Mface21' || icon === 'Mface31') && monsterRawName !== 'shovelR';
  const totalChance = breedingMultipliers?.totalChance > 0.1
    ? `${notateNumber(Math.min(100, 100 * breedingMultipliers?.totalChance), 'Micro')}%`
    : `1 in ${Math.max(1, Math.ceil(1 / breedingMultipliers?.totalChance))}`;
  const timeToThreshold = getTimeToLevel(pet, multi.value, amount, applyThreshold
    ? currentThreshold
    : 5, isShiny);


  return <Card variant={'outlined'}
               sx={{
                 width: 300,
                 opacity: unlocked && level > 0 ? 1 : .6,
                 border: amount > 0 && (isShiny ? fencePet?.shiny > 0 : fencePet?.breedability > 0)
                   ? '1px solid'
                   : '',
                 borderColor: isShiny && level >= 20
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
            src={missingIcon ? `${prefix}afk_targets/${monsterName}.png` : `${prefix}data/${icon}.png`}
            missingIcon={missingIcon}
            alt=""/>
        </Badge>
        <Stack sx={{ width: '100%' }} gap={.5}>
          <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
            <Typography variant={'body1'}>{cleanUnderscore(monsterName)}</Typography>
          </Stack>
          <Stack direction={'row'} divider={<Divider orientation={'vertical'} sx={{ mx: 1 }} flexItem/>}>
            <Typography variant={'caption'}> Lv. {level}</Typography>
            <Typography variant={'caption'}>
              {notateNumber(progress)} / {numberWithCommas(goal.toFixed(2).replace('.00', ''))} Days
            </Typography>
          </Stack>
          {(timeLeft && level < 20) || !isShiny ? <Stack direction="row" alignItems={'center'} gap={1}>
            <Typography variant={'body2'}>Next lv: </Typography>
            <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                   staticTime
                   variant={'body2'}
                   date={new Date().getTime() + (timeLeft)}/>
          </Stack> : <Typography variant={'body2'}>{level >= 20 ? 'Maxed!' : '\u00A0'}</Typography>}
          {timeToThreshold > 0 && timeLeft && timeToThreshold !== timeLeft ? <>
            <Stack flexWrap={'wrap'} direction={'row'}
                   gap={1}>
              <Typography component={'span'} variant={'body2'}>To {(isShiny
                ? shinyThreshold
                : breedabilityThreshold) ?? 5}:</Typography>
              <Timer variant={'caption'} type={'countdown'} lastUpdated={state?.lastUpdated}
                     staticTime
                     date={new Date().getTime() + (timeToThreshold)}/>
            </Stack>
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
              <InfoIcon fontSize={'small'}/>
            </Tooltip>
          </Stack> : null}
        </Stack>
      </Stack>
      {isShiny ? <>
        <Divider sx={{ my: 1 }}/>
        <Stack>
          <Typography variant={'body2'}>Shiny Passive:</Typography>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Typography variant={'body2'}>{cleanUnderscore(passive)}</Typography>
            <Tooltip
              title={`Total ${cleanUnderscore(rawPassive).replace(/[{}+]/g, '')}: ${state?.account?.breeding?.passivesTotals?.[rawPassive]}`}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </Stack>
      </> : null}
    </CardContent>
  </Card>;
};

const Other = ({ pets, fencePets, isShiny, multi }) => {
  const { state } = useContext(AppContext);
  const [Element, showAllPets, setShowAllPets] = useCheckbox('Show all pets', true);
  const [OrderElement, orderByTime] = useCheckbox('Order by time', false);
  const [ThresholdElement, applyThreshold] = useCheckbox('Apply threshold', false);
  const [GroupElement, groupByStat] = useCheckbox('Group by stat', false);
  const [shinyThreshold, setShinyThreshold] = useLocalStorage({ key: `breeding:shinyLevelThreshold`, defaultValue: 5 });
  const [breedabilityThreshold, setBreedabilityThreshold] = useLocalStorage({
    key: `breeding:breedabilityLevelThreshold`,
    defaultValue: 5
  });
  const [selectedPassive, setSelectedPassive] = useLocalStorage({
    key: `breeding:selectedPassive`,
    defaultValue: null
  });

  const uniquePassives = useMemo(() => {
    return [...new Set(pets.map(pet => cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '')))].sort();
  }, [pets]);

  const hasPetsUnderThreshold = useMemo(() => {
    if (!applyThreshold) return true;

    if (!showAllPets) {
      return pets.some(({ monsterRawName, shinyLevel, breedingLevel, rawPassive }) => {
        if (isShiny && selectedPassive && cleanUnderscore(rawPassive).replace(/[{}+]/g, '') !== selectedPassive) return false;
        const fencePet = fencePets[monsterRawName];
        const amount = isShiny ? fencePet?.shiny : fencePet?.breedability;
        if (!amount) return false;
        if (isShiny && !fencePet?.shiny > 0) return false;
        if (!isShiny && !fencePet?.breedability > 0) return false;
        return isShiny ? shinyLevel < shinyThreshold : breedingLevel < breedabilityThreshold;
      });
    }
    return pets.some(({ shinyLevel, breedingLevel, rawPassive }) => {
      if (isShiny && selectedPassive && cleanUnderscore(rawPassive).replace(/[{}+]/g, '') !== selectedPassive) return false;
      return isShiny ? shinyLevel < shinyThreshold : breedingLevel < breedabilityThreshold;
    });
  }, [pets, shinyThreshold, breedabilityThreshold, showAllPets, isShiny, fencePets, applyThreshold, selectedPassive]);

  const reorderPets = useMemo(() => {
    const mappedPets = pets?.map((pet) => ({
      ...pet,
      timeLeft: isShiny
        ? ((pet?.shinyGoal - pet?.shinyProgress) / multi.value / (fencePets?.[pet?.monsterRawName]?.shiny || 1)) * 8.64e+7
        : ((pet?.breedingGoal - pet?.breedingProgress) / multi.value / (fencePets?.[pet?.monsterRawName]?.breedability || 1)) * 8.64e+7
    }));

    const filteredPets = isShiny && selectedPassive
      ? mappedPets.filter(pet => cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '') === selectedPassive)
      : mappedPets;

    return orderByTime ? filteredPets?.toSorted((a, b) => a?.timeLeft - b?.timeLeft) : filteredPets;
  }, [pets, isShiny, multi.value, orderByTime, selectedPassive, fencePets]);

  const groupedPets = useMemo(() => {
    if (!isShiny || !groupByStat) return reorderPets;

    return reorderPets.reduce((acc, pet) => {
      const passive = cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '');
      if (!acc[passive]) {
        acc[passive] = [];
      }
      acc[passive].push(pet);
      return acc;
    }, {});
  }, [reorderPets, isShiny, groupByStat]);

  const totalLevels = pets.reduce((acc, pet) => (isShiny ? pet.shinyLevel : pet.breedingLevel) + acc, 0)

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      <CardTitleAndValue title={'Misc'} value={<Stack gap={1}>
        <Stack direction={'row'} gap={.5} alignItems={'center'}>
          <Typography variant={'body1'}>
            Multi: {multi?.value?.toFixed(2).replace('.00', '')}x
          </Typography>
          <Tooltip title={<Breakdown breakdown={multi?.breakdown} notation={'MultiplierInfo'}/>}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
        <Typography variant={'body1'}>
          Total levels: {totalLevels}
        </Typography>
      </Stack>}>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Options'} value={<Stack>
        <Element checked={showAllPets}/>
        {isShiny && <GroupElement checked={groupByStat}/>}
        <OrderElement checked={orderByTime}/>
      </Stack>}/>
      <CardTitleAndValue title={isShiny ? 'Shiny pet level threshold' : 'Breedability pet level threshold'}
                         value={<Stack>
                           <ThresholdElement checked={applyThreshold}/>
                           <TextField size={'small'} sx={{ width: 'fit-content', mt: 1 }}
                                      type={'number'} value={isShiny ? shinyThreshold : breedabilityThreshold}
                                      onChange={(e) => isShiny
                                        ? setShinyThreshold(e.target.value)
                                        : setBreedabilityThreshold(e.target.value)}
                                      helperText={isShiny
                                        ? 'Show shiny pets under this level only'
                                        : 'Show breedability pets under this level only'}/>
                         </Stack>}/>
      {isShiny ? <CardTitleAndValue title={'Filter by stat'} value={
        <Autocomplete
          sx={{ mt: 2 }}
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
              sx={{ width: 200 }}
            />
          )}
        />
      }/> : null}
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
              shinyThreshold={shinyThreshold}
              breedabilityThreshold={breedabilityThreshold}
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
          shinyThreshold={shinyThreshold}
          breedabilityThreshold={breedabilityThreshold}
        />
      ))}
    </AutoGrid>}
  </>
};

export default Other;
