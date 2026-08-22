import { Card, CardContent, FormControl, InputLabel, Select, Stack, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { fillArrayToLength, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Timer from 'components/common/Timer';
import Tooltip from '../../../components/Tooltip';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import { calcTotalCritters, getShinyChanceInfo, getTrapsBonuses } from '@parsers/world-3/traps';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import MenuItem from '@mui/material/MenuItem';

const Traps = () => {
  const { state } = useContext(AppContext);
  const { traps } = state?.account || {};
  const [selectedChar, setSelectedChar] = useState(null);
  const bonuses = getTrapsBonuses(state?.account, state?.characters);
  const collectRates = bonuses?.perCharacter ?? [];
  // Derived rather than stored: the character list only arrives after mount, so an initial index
  // would pin the page to whoever happened to be first instead of the best collector.
  const bestIndex = collectRates.reduce((best, { critter }, index) => critter > collectRates[best].critter
    ? index
    : best, 0);
  const selectedIndex = state?.characters?.findIndex((character) => character?.playerId === selectedChar) ?? -1;
  const activeIndex = selectedIndex >= 0 ? selectedIndex : bestIndex;
  const activeCharacter = state?.characters?.[activeIndex];
  const collectRate = collectRates[activeIndex] ?? bonuses?.max;
  const totals = calcTotalCritters(state?.account, collectRate);
  const shiny = getShinyChanceInfo(state?.account, state?.characters, activeCharacter);

  return <>
    <NextSeo
      title="Traps | Idleon Toolbox"
      description="Keep track of your traps timing, critters amounts and more"
    />
    <Stack direction={'row'} gap={2}>
      <Stack>
        {state?.characters?.length ? <FormControl sx={{ mt: 2, mb: 1 }}>
          <InputLabel id="collect-as-label">Collect as</InputLabel>
          <Select
            size={'small'}
            labelId="collect-as-label"
            id="collect-as-select"
            value={activeCharacter?.playerId ?? ''}
            label="Collect as"
            onChange={(e) => setSelectedChar(e.target.value)}
          >
            {state?.characters?.map((character, index) => <MenuItem key={`${character?.name}-${index}`}
                                                                   value={character?.playerId}>
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/ClassIcons${character?.classIndex}.png`} alt="" width={24} height={24}/>
                <Typography>{character?.name}</Typography>
              </Stack>
            </MenuItem>)}
          </Select>
        </FormControl> : null}
        <Typography component={'p'} variant={'caption'}>Collect Rates: {Math.round(collectRate?.critter * 100)}%
          and {Math.round(collectRate?.exp * 100)}% EXP</Typography>
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <Typography component={'p'} variant={'caption'}>
            Shiny: {notateNumber(shiny?.multiplier, 'MultiplierInfo')}x, {shiny?.bundleSize} per drop
          </Typography>
          <Breakdown data={shiny?.breakdown}>
            <IconInfoCircleFilled size={16} style={{ cursor: 'pointer', display: 'block' }}/>
          </Breakdown>
        </Stack>
      </Stack>
      {totals ? <Totals hideExp array={totals} index={'total'}/> : null}
    </Stack>
    <Stack gap={1} mt={2}>
      {traps?.map((trapSlots, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const trappingLevel = state?.characters?.[index].skillsInfo?.trapping?.level;
        const trap = state?.characters?.[index]?.tools?.find(({ Type }) => Type === 'TRAP_BOX_SET');
        const callMeAshBubble = state?.account?.alchemy?.bubbles?.quicc?.find(({ bubbleName }) => bubbleName === 'CALL_ME_ASH')?.level;
        const plusOneTrap = callMeAshBubble > 0 ? 1 : 0;
        const usedTrap = state?.characters?.[index]?.tools?.[4]?.rawName !== 'Blank'
          ? state?.characters?.[index]?.tools?.[4]
          : null;
        let maxTraps = usedTrap
          ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + plusOneTrap
          : trapSlots.length;
        maxTraps = Math.min(maxTraps, 8);
        const realTraps = trapSlots.length >= maxTraps ? trapSlots : fillArrayToLength(maxTraps, trapSlots);
        const charTotals = trapSlots.reduce((total, { crittersQuantity, trapExp, rawName }) => {
          return {
            ...total,
            [rawName]: {
              critters: (total?.[rawName]?.critters ?? 0) + (crittersQuantity * collectRate?.critter),
              exp: (total?.[rawName]?.exp ?? 0) + (trapExp * collectRate?.exp)
            }
          }
        }, {});
        return <React.Fragment key={`printer-row-${index}`}>
          <Card sx={{ width: { lg: 920, xl: 'fit-content' } }}>
            <CardContent sx={{ '&:last-child': { padding: '6px' } }}>
              <Stack direction="row" alignItems={'center'} gap={2} flexWrap={'wrap'}>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Stack sx={{ width: 175, flexDirection: { xs: 'column', md: 'row' } }}
                           alignItems={'center'} gap={2}>
                      <Stack alignItems={'center'} justifyContent={'center'}>
                        <img style={{ height: 24 }} src={`${prefix}data/ClassIcons${classIndex}.png`} alt="class-icon"/>
                        <img style={{ height: 24 }} src={`${prefix}data/${trap?.rawName}.png`} alt="trap-icon"/>
                      </Stack>
                      <Stack>
                        <Typography variant={'body1'}>{playerName}</Typography>
                        <Typography variant={'caption'}>Trapping lv. {trappingLevel}</Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
                <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={3}>
                  {realTraps?.map((slot, slotIndex) => {
                    return <Card sx={{ borderColor: slot?.active ? 'success.light' : 'none' }}
                                 variant={'outlined'}
                                 key={`${slot?.rawName || 'trap'}-${slotIndex}`}>
                      <CardContent>
                        <Stack sx={{ width: { xs: 65, sm: 80 }, height: 50 }} position={'relative'}
                               justifyContent={'flex-start'}
                               alignItems={'center'}>
                          {slot?.name ? <>
                              <Stack direction={'row'}>
                                <Tooltip
                                  title={<TrapTooltip {...slot?.trapData} trapExp={slot?.trapExp * collectRate?.exp}
                                                      crittersQuantity={slot?.crittersQuantity * collectRate?.critter}/>}>
                                  <FloatingItemIcon src={`${prefix}data/TrapBoxSet${slot?.trapType + 1}.png`} alt="trap-icon"/>
                                </Tooltip>
                                <ItemIcon src={`${prefix}data/${slot?.rawName}.png`} alt="item-icon"/>
                              </Stack>
                              <Timer type={'countdown'} date={slot?.timeLeft}
                                     lastUpdated={state?.lastUpdated}/></> :
                            <Typography color={slot?.name ? '' : 'error.light'}>Empty</Typography>}
                        </Stack>
                      </CardContent>
                    </Card>
                  })}
                </Stack>
                {realTraps?.length > 0 ? <Totals outlined title={'Total critters'} array={charTotals} index={index}/> :
                  <Card variant={'outlined'}><CardContent>{playerName} has no traps</CardContent></Card>}
              </Stack>
            </CardContent>
          </Card>
        </React.Fragment>
      })}
    </Stack>
  </>;
};

const Totals = ({ array, index, outlined = false, hideExp }) => {
  return <Stack mb={3} direction={'row'} gap={2}>
    <CardTitleAndValue variant={outlined ? 'outlined' : 'elevation'} title={'Totals'} cardSx={{ my: 0, mb: 0 }}>
      <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
        {Object.entries(array).map(([critterName, { critters, exp }], totalIndex) => {
          return <Stack alignItems={'center'} gap={1} key={`total-${index}-${totalIndex}-${critterName}`}
                        direction={'row'}>
            <ItemIcon src={`${prefix}data/${critterName}.png`} alt="critter-icon"/>
            <Stack>
              <Typography variant={'body2'}>Critters: {notateNumber(critters)}</Typography>
              {hideExp ? null : <Typography variant={'body2'}>Exp: {notateNumber(exp)}</Typography>}
            </Stack>
          </Stack>
        })}
      </Stack>
    </CardTitleAndValue>
  </Stack>
}

const TrapTooltip = ({ quantity, exp, trapType, crittersQuantity, trapExp }) => {
  return <>
    <TitleAndValue title={'Quantity'} value={`x${quantity}`}/>
    <TitleAndValue title={trapType === 0 ? 'Exp' : 'Shiny'} value={`x${exp}`}/>
    <TitleAndValue title={'Trap exp'} value={notateNumber(trapExp)}/>
    <TitleAndValue title={'Critters'} value={notateNumber(crittersQuantity)}/>
  </>
}

const ItemIcon = styled.img`
  z-index: 2;
  width: 32px;
  height: 32px;
`

const FloatingItemIcon = styled.img`
  z-index: 1;
  width: 32px;
  height: 32px;
`

export default Traps;
