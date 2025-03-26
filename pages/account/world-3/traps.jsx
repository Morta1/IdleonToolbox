import { Card, CardContent, FormControl, InputLabel, Select, Stack, Typography } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { fillArrayToLength, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Timer from 'components/common/Timer';
import Tooltip from '../../../components/Tooltip';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import { calcTotalCritters, getTrapsBonuses } from '../../../parsers/traps';
import MenuItem from '@mui/material/MenuItem';

const Traps = () => {
  const { state } = useContext(AppContext);
  const { traps } = state?.account || {};
  const [bonus, setBonus] = useState('max');
  const bonuses = useMemo(() => getTrapsBonuses(state?.account, state?.characters), [state]);
  const totals = useMemo(() => calcTotalCritters(state?.account, bonuses?.[bonus]), [state, bonus]);

  return <>
    <NextSeo
      title="Traps | Idleon Toolbox"
      description="Keep track of your traps timing, critters amounts and more"
    />
    <Stack direction={'row'} gap={2}>
      <Stack>
        <FormControl sx={{ mt: 2, mb: 1 }}>
          <InputLabel id="demo-simple-select-label">Collect as</InputLabel>
          <Select
            size={'small'}
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={bonus}
            label="Collect as"
            onChange={(e) => setBonus(e.target.value)}
          >
            <MenuItem value={'max'}>Hunter</MenuItem>
            <MenuItem value={'min'}>Non Hunter</MenuItem>
          </Select>
        </FormControl>
        <Typography component={'p'} variant={'caption'}>Collect Rates: {Math.round(bonuses?.[bonus]?.critter * 100)}%
          and {Math.round(bonuses?.[bonus]?.exp * 100)}% EXP</Typography>
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
              critters: (total?.[rawName]?.critters ?? 0) + (crittersQuantity * bonuses?.[bonus]?.critter),
              exp: (total?.[rawName]?.exp ?? 0) + (trapExp * bonuses?.[bonus]?.exp)
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
                                  title={<TrapTooltip {...slot?.trapData} trapExp={slot?.trapExp * bonuses?.[bonus]?.exp}
                                                      crittersQuantity={slot?.crittersQuantity * bonuses?.[bonus]?.critter}/>}>
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
  return <Stack direction={'row'} gap={2}>
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
