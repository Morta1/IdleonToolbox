import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { IconChartCohort, IconTable } from '@tabler/icons-react';


const COLOR_MAP = {
  0: 'White',
  1: 'Green',
  2: 'Yellow',
  3: 'Blue',
  4: 'Purple',
  5: 'Red',
  6: 'Cyan'
}
const Upgrades = ({ upgrades, totalUpgradesLevels, resourceKey = prefix }) => {
  const [sortByCost, setSortByCost] = useLocalStorage({
    key: `${prefix}:summoningUpgrades:sortByCost`,
    defaultValue: false
  });  const [viewMode, setViewMode] = useLocalStorage({
    key: `${prefix}:summoningUpgrades:viewMode`,
    defaultValue: 'group'
  });

  const listForm = useMemo(() => Object.values(upgrades).flat(), [upgrades]);
  const getSortedList = (list) => {
    return list.filter(({
                          level,
                          maxLvl
                        }) => level < maxLvl).sort((a, b) => a.totalCost - b.totalCost)
  };

  return <Stack>
    <Stack mb={3} direction={'row'} alignItems={'center'}>
      <ToggleButton sx={{ mr: 2, '&:disabled': { color: '#FFFFFF' } }} value={'maxLevel'} disabled>Total
        Upgrades: {totalUpgradesLevels}</ToggleButton>
      <FormControlLabel
        sx={{ width: 'fit-content' }}
        control={<Checkbox name={'mini'} checked={sortByCost}
                           size={'small'}
                           onChange={() => setSortByCost(!sortByCost)}/>}
        label={'Sort by cost'}/>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        sx={{ ml: 'auto' }}
        onChange={(_, val) => val && setViewMode(val)}
      >
        <Tooltip title={'Group view'}><ToggleButton sx={{ height: 40 }}
                                                    value="group"><IconChartCohort/></ToggleButton></Tooltip>
        <Tooltip title={'Grid view'}><ToggleButton sx={{ height: 40 }}
                                                   value="grid"><IconTable/></ToggleButton></Tooltip>
      </ToggleButtonGroup>
    </Stack>
    {viewMode === 'grid' ? <Box sx={{
        display: 'grid',
        '--auto-grid-min-size': '16rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))',
        gap: '1rem'
      }}>
        {(sortByCost ? getSortedList(listForm) : listForm).map(({
                                                              level,
                                                              value,
                                                              maxLvl,
                                                              name,
                                                              bonus,
                                                              totalBonus,
                                                              doubled,
                                                              totalCost,
                                                              originalIndex,
                                                              colour
                                                            }, index) => {
          const unlocked = (level > 0) || (colour === '0' && originalIndex === 2);
          return <Card key={'upgrade-' + index} sx={{ opacity: unlocked ? 1 : .5 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Stack direction={'row'} gap={1}>
                <img width={42} height={42} src={`${prefix}data/SumUpgIc${originalIndex}.png`} alt={''}/>
                <Stack>
                  <Typography>{cleanUnderscore(name)}</Typography>
                  <Typography variant={'caption'}>Lv. {level} / {maxLvl}</Typography>
                </Stack>
                {doubled ? <img style={{ marginLeft: 'auto' }} width={24} height={24}
                                src={`${prefix}etc/Doubled.png`}
                                alt={''}/> : null}
              </Stack>
              <Typography>{cleanUnderscore(bonus.replace('{', value).replace('}', totalBonus))}</Typography>
              <Typography mt={'auto'} variant={'caption'}>Cost: {totalCost ? notateNumber(totalCost) : 0}</Typography>
            </CardContent>
          </Card>
        })}
      </Box> :
      <>{Object.entries(upgrades || {})?.map(([colorIndex, colorUpgrades]) => {
        const currentList = sortByCost ? getSortedList(colorUpgrades) : colorUpgrades;
        return COLOR_MAP[colorIndex] ? <Stack key={'color-upgrade-' + colorIndex}>
          <Typography variant={'h5'}>{COLOR_MAP[colorIndex]}</Typography>
          <Stack direction={'row'} flexWrap={'wrap'} gap={1} my={1}>
            {currentList.map(({
                                level,
                                value,
                                maxLvl,
                                name,
                                bonus,
                                totalBonus,
                                doubled,
                                totalCost,
                                originalIndex
                              }, index) => {
              const unlocked = (level > 0) || (colorIndex === '0' && originalIndex === 2);
              return <Card key={'upgrade-' + index} sx={{ width: 220, opacity: unlocked ? 1 : .5 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Stack direction={'row'} gap={1}>
                    <img width={42} height={42} src={`${prefix}data/SumUpgIc${originalIndex}.png`} alt={''}/>
                    <Stack>
                      <Typography>{cleanUnderscore(name)}</Typography>
                      <Typography variant={'caption'}>Lv. {level} / {maxLvl}</Typography>
                    </Stack>
                    {doubled ? <img style={{ marginLeft: 'auto' }} width={24} height={24}
                                    src={`${prefix}etc/Doubled.png`}
                                    alt={''}/> : null}
                  </Stack>
                  <Typography>{cleanUnderscore(bonus.replace('{', value).replace('}', totalBonus))}</Typography>
                  <Typography mt={'auto'} variant={'caption'}>Cost: {totalCost
                    ? notateNumber(totalCost)
                    : 0}</Typography>
                </CardContent>
              </Card>
            })}
          </Stack>
        </Stack> : null
      })}</>}
  </Stack>
};

export default Upgrades;
