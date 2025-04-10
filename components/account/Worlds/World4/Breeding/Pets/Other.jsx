import { Autocomplete, Badge, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import React, { useContext, useMemo } from 'react';
import { MonsterIcon } from './styles';
import AutoGrid from '@components/common/AutoGrid';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';
import { CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';
import Timer from '@components/common/Timer';
import { AppContext } from '@components/common/context/AppProvider';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';

const Other = ({ pets, fencePets, isShiny, multi }) => {
  const { state } = useContext(AppContext);
  const [Element, showAllPets, setShowAllPets] = useCheckbox('Show all pets', true);
  const [OrderElement, orderByTime] = useCheckbox('Order by time', false);
  const [ThresholdElement, applyThreshold] = useCheckbox('Apply threshold', false);
  const [threshold, setThreshold] = useLocalStorage({ key: `breeding:levelThreshold`, defaultValue: 5 });
  const [selectedPassive, setSelectedPassive] = useLocalStorage({ key: `breeding:selectedPassive`, defaultValue: null });

  const uniquePassives = useMemo(() => {
    return [...new Set(pets.map(pet => cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '')))].sort();
  }, [pets]);

  const hasPetsUnderThreshold = useMemo(() => {
    if (!applyThreshold) return true;
    
    if (!showAllPets) {
      return pets.some(({ monsterRawName, shinyLevel, breedingLevel, rawPassive }) => {
        if (isShiny && selectedPassive && cleanUnderscore(rawPassive).replace(/[{}+]/g, '') !== selectedPassive) return false;
        const fencePet = fencePets[monsterRawName];
        if (!fencePet?.amount) return false;
        if (isShiny && !fencePet?.isShiny) return false;
        if (!isShiny && !fencePet?.isBreedability) return false;
        return isShiny ? shinyLevel < threshold : breedingLevel < threshold;
      });
    }
    return pets.some(({ shinyLevel, breedingLevel, rawPassive }) => {
      if (isShiny && selectedPassive && cleanUnderscore(rawPassive).replace(/[{}+]/g, '') !== selectedPassive) return false;
      return isShiny ? shinyLevel < threshold : breedingLevel < threshold;
    });
  }, [pets, threshold, showAllPets, isShiny, fencePets, applyThreshold, selectedPassive]);

  const reorderPets = useMemo(() => {
    const mappedPets = pets?.map((pet) => ({
      ...pet,
      timeLeft: isShiny
        ? ((pet?.shinyGoal - pet?.shinyProgress) / multi.value / (fencePets?.[pet?.monsterRawName]?.amount || 1)) * 8.64e+7
        : ((pet?.breedingGoal - pet?.breedingProgress) / multi.value / (fencePets?.[pet?.monsterRawName]?.amount || 1)) * 8.64e+7
    }));

    const filteredPets = isShiny && selectedPassive 
      ? mappedPets.filter(pet => cleanUnderscore(pet.rawPassive).replace(/[{}+]/g, '') === selectedPassive)
      : mappedPets;

    return orderByTime ? filteredPets?.toSorted((a, b) => a?.timeLeft - b?.timeLeft) : filteredPets;
  }, [pets, isShiny, multi.value, orderByTime, selectedPassive, fencePets]);

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      <CardWithBreakdown title={isShiny ? 'Shiny multi' : 'Breedability multi'}
        notation={'MultiplierInfo'}
        value={`${multi?.value?.toFixed(2).replace('.00', '')}x`}
        breakdown={multi?.breakdown} />
      <CardTitleAndValue title={'Options'} value={<Stack>
        <Element checked={showAllPets} />
        <OrderElement checked={orderByTime} />
      </Stack>} />
      <CardTitleAndValue title={'Pet level threshold'}
        value={<Stack>
          <ThresholdElement checked={applyThreshold} />
          <TextField size={'small'} sx={{ width: 'fit-content', mt: 1 }}
            type={'number'} value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            helperText={'Show pets under this level only'} />
        </Stack>} />
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
      } /> : null}
    </Stack>
    {!hasPetsUnderThreshold ? <Typography variant={'h5'}>
      All pets are above the set threshold, increase the threshold to see more pets.
    </Typography> : <AutoGrid>
      {reorderPets.map(({
        monsterName,
        monsterRawName,
        icon,
        passive,
        shinyLevel,
        breedingLevel,
        gene,
        unlocked,
        shinyProgress,
        breedingProgress,
        shinyGoal,
        breedingGoal,
        breedingMultipliers,
        rawPassive
      }) => {
        const progress = isShiny ? shinyProgress : breedingProgress;
        const level = isShiny ? shinyLevel : breedingLevel;
        if (applyThreshold && level >= threshold) return null;
        const goal = isShiny ? shinyGoal : breedingGoal;
        const fencePet = fencePets[monsterRawName];
        if (!showAllPets && (!fencePet?.amount || (isShiny
          ? !fencePet?.isShiny
          : !fencePet?.isBreedability))) return null;
        const timeLeft = ((goal - progress) / multi.value / (fencePets?.[monsterRawName]?.amount || 1)) * 8.64e+7;
        const missingIcon = (icon === 'Mface23' || icon === 'Mface21' || icon === 'Mface31') && monsterRawName !== 'shovelR';
        const totalChance = breedingMultipliers?.totalChance > 0.1
          ? `${notateNumber(Math.min(100, 100 * breedingMultipliers?.totalChance), 'Micro')}%`
          : `1 in ${Math.max(1, Math.ceil(1 / breedingMultipliers?.totalChance))}`;
        return <Card key={monsterName} variant={'outlined'}
          sx={{
            opacity: unlocked && level > 0 ? 1 : .6,
            border: fencePet?.amount > 0 && (isShiny ? fencePet?.isShiny : fencePet?.isBreedability)
              ? '1px solid'
              : '',
            borderColor: fencePet?.amount > 0 && (isShiny ? fencePet?.isShiny : fencePet?.isBreedability)
              ? 'success.main'
              : ''
          }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ width: '100%' }}>
              <Badge anchorOrigin={{ vertical: 'top', horizontal: 'left' }} color="primary"
                badgeContent={isShiny && fencePet?.isShiny || !isShiny && fencePet?.isBreedability
                  ? fencePet?.amount : null}
                sx={{ '& .MuiBadge-badge': { top: 10, left: 5 } }}>
                <MonsterIcon
                  src={missingIcon ? `${prefix}afk_targets/${monsterName}.png` : `${prefix}data/${icon}.png`}
                  missingIcon={missingIcon}
                  alt="" />
              </Badge>
              <Stack sx={{ width: '100%' }} gap={.5}>
                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                  <Typography variant={'body1'}>{cleanUnderscore(monsterName)}</Typography>
                </Stack>
                <Stack direction={'row'} divider={<Divider orientation={'vertical'} sx={{ mx: 1 }} flexItem />}>
                  <Typography variant={'caption'}> Lv. {level}</Typography>
                  <Typography variant={'caption'}>
                    {notateNumber(progress)} / {numberWithCommas(goal.toFixed(2).replace('.00', ''))} Days
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems={'center'} gap={1}>
                  <Typography variant={'body2'}>Next lv: </Typography>
                  <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                    staticTime
                    variant={'body2'}
                    date={new Date().getTime() + (timeLeft)} />
                </Stack>
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
            {/*<Divider sx={{ my: 1 }}/>*/}
            {/*<Stack>*/}
            {/*  <Typography variant={'caption'}>Gene:</Typography>*/}
            {/*  <Stack direction={'row'} gap={1}>*/}
            {/*    <GeneIcon src={`${prefix}data/GeneReady${gene?.index}.png`} alt=""/>*/}
            {/*    <Typography>{cleanUnderscore(gene?.name)}</Typography>*/}
            {/*  </Stack>*/}
            {/*</Stack>*/}
          </CardContent>
        </Card>
      })}

    </AutoGrid>}
  </>
};

export default Other;
