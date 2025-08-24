import { Card, CardContent, FormControl, InputLabel, Select, Stack, Typography } from '@mui/material';
import { commaNotation, msToDate, notateNumber, prefix } from '@utility/helpers';
import Timer from '@components/common/Timer';
import React, { useCallback, useEffect, useState } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import { getCropEvolution, getProductDoubler, getTotalCrop } from '@parsers/world-6/farming';
import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import MenuItem from '@mui/material/MenuItem';
import { CLASSES, getCharacterByHighestTalent } from '@parsers/talents';
import { getPlayerLabChipBonus } from '@parsers/lab';
import useCheckbox from '@components/common/useCheckbox';

const Plot = ({ plot, market, ranks, lastUpdated, account, characters }) => {
  const { productDoubler, percent, multi } = getProductDoubler(market) || {};
  const totals = getTotalCrop(plot, market, ranks, account);
  const [selectedCharacter, setSelectedCharacter] = useState(characters?.[0]);
  const [NanoCheckboxEl, enableNano, setEnableNano] = useCheckbox('Force nano chip');

  useEffect(() => {
    const highestMassIrrigation = getCharacterByHighestTalent(characters, CLASSES.Death_Bringer, 'MASS_IRRIGATION');
    setSelectedCharacter(highestMassIrrigation);
  }, [characters]);

  const hasNanoAndGordonius = useCallback(
    () => {
      const hasChip = getPlayerLabChipBonus(selectedCharacter, account, 15);
      const hasGordonius = selectedCharacter?.starSigns?.find(({ starName }) => starName === 'Cropiovo_Minor');
      return !!hasChip && !!hasGordonius;
    }, [selectedCharacter]);

  useEffect(() => {
    setEnableNano(hasNanoAndGordonius());
  }, [selectedCharacter]);

  return <>
    <Stack direction={'row'} gap={2}>
      <CardTitleAndValue title={'Crop Evo'} stackProps>
        <FormControl sx={{ width: 170, mt: 1 }}>
          <InputLabel id="selected-character">Character</InputLabel>
          <Select
            size={'small'}
            labelId="selected-character"
            id="selected-character"
            value={selectedCharacter?.playerId}
            label="Character"
            onChange={(e) => {
              setSelectedCharacter(characters?.[e.target.value])
            }}
          >
            {characters?.map((character) => <MenuItem key={'option' + character.name}
                                                      value={character?.playerId}>{character.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction={'row'} alignItems={'center'}>
          <NanoCheckboxEl disabled={hasNanoAndGordonius()}/>
          <Tooltip title={'Enabling nano chip assumes you have Cropiovo minor star sign *active*'}>
            <IconInfoCircleFilled size={18}></IconInfoCircleFilled>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={<Stack sx={{ mb: 1 }} direction={'row'} alignItems={'center'}>
        <Typography variant={'body1'}>Totals{productDoubler > 100 && multi >= 2 ? ` (x${multi})` : ''}</Typography>
        <Tooltip title={productDoubler < 100 ? <Typography variant={'caption'}
                                                           color={'text.secondary'}>*
          Doesn't include your {productDoubler}% chance to
          x2 the quantity collected from product doubler</Typography> : percent > 0 ? <Typography variant={'caption'}
                                                                                                  color={'text.secondary'}>*
          Doesn't
          include your {percent}% chance to
          x{parseInt(multi) + 1} the quantity
          collected from product doubler</Typography> : null}>
          <IconInfoCircleFilled style={{ marginLeft: 8 }} size={18}/>
        </Tooltip>
      </Stack>}>
        <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          {Object.entries(totals || {}).map(([icon, quantity]) => {
            return <Card variant={'outlined'} key={icon}>
              <CardContent sx={{ '&:last-child': { padding: 1.5 } }}>
                <Stack direction={'row'} gap={1}>
                  <Typography>{commaNotation(Math.round(quantity))}</Typography>
                  <img width={20} height={20} src={`${prefix}data/${icon}`} alt={''}/>
                </Stack>
              </CardContent>
            </Card>
          })}
        </Stack>
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {plot?.map((crop, index) => {
        let {
          rank,
          rankProgress,
          rankRequirement,
          cropQuantity,
          cropRawName,
          seedRawName,
          nextOGChance,
          isLocked,
          currentOG,
          ogMulti,
          timeLeft,
          maxTimeLeft
        } = crop;
        nextOGChance = Math.min(100, 100 * nextOGChance);
        nextOGChance = nextOGChance >= 10 ? nextOGChance : 10 * nextOGChance / 10;
        const nextEvoChance = getCropEvolution(account, selectedCharacter, crop, enableNano);
        return <Card key={'plot-' + index} sx={{ width: 200, mt: 1 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}etc/${seedRawName}`} alt={''}/>
              <Stack>
                <Stack direction={'row'} gap={1}>
                  <Typography>{cropQuantity}</Typography>
                  <img width={20} height={20} src={`${prefix}data/${cropRawName}`} alt={''}/>
                  <Tooltip title={<Typography style={{ fontWeight: 400 }}>Max
                    time: {msToDate(maxTimeLeft * 1000)}</Typography>}>
                    <IconInfoCircleFilled size={18}/>
                  </Tooltip>
                </Stack>
                <Typography variant={'caption'}>Floor {Math.floor((index / 9) + 1)}</Typography>
                {account?.farming?.hasLandRank ? <Typography variant={'caption'}>Rank {rank || 0}</Typography> : null}
                <Typography
                  variant={'caption'}>{rankProgress ? notateNumber(rankProgress) : 0} / {rankRequirement
                  ? notateNumber(rankRequirement)
                  : 0}</Typography>
                <Stack direction={'row'} gap={.5}>
                  <Typography variant={'caption'}>Crop evo: {nextEvoChance?.value}%</Typography>
                  <Tooltip
                    title={<Breakdown breakdown={nextEvoChance?.breakdown} titleStyle={{ width: 160 }} skipNotation/>}>
                    <IconInfoCircleFilled size={16}/>
                  </Tooltip>
                </Stack>
              </Stack>
              {isLocked ? <LockIcon sx={{ ml: 'auto' }}/> : null}
            </Stack>
            <Typography mt={2}>Current OG: {currentOG} (x{ogMulti})</Typography>
            <Typography>Next OG: {nextOGChance.toFixed(3).replace('.000', '')}%</Typography>
            <Timer type={'countdown'} lastUpdated={lastUpdated}
                   placeholder={'Ready'}
                   date={new Date().getTime() + timeLeft * 1000}/>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

export default Plot;
