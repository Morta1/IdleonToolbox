import { Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { fillArrayToLength, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Timer from 'components/common/Timer';
import Tooltip from '../../../components/Tooltip';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import { calcCrittersBonus, calcTotalCritters } from '../../../parsers/traps';

const Traps = () => {
  const { state } = useContext(AppContext);
  const { traps } = state?.account || {};
  const totals = useMemo(() => calcTotalCritters(state), [state]);

  return <>
    <NextSeo
      title="Traps | Idleon Toolbox"
      description="Keep track of your traps timing, critters amounts and more"
    />
    <Typography variant={'h2'} mb={3}>Traps</Typography>
    {totals ? <Totals hideExp array={totals} index={'total'}/> : null}
    <Stack gap={3}>
      {traps?.map((trapSlots, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const trappingLevel = state?.characters?.[index].skillsInfo?.trapping?.level;
        const trap = state?.characters?.[index]?.tools?.find(({ name }) => name.includes('Trap'));
        const callMeAshBubble = state?.account?.alchemy?.bubbles?.quicc?.find(({ bubbleName }) => bubbleName === 'CALL_ME_ASH')?.level;
        const plusOneTrap = callMeAshBubble > 0 ? 1 : 0;
        const usedTrap = state?.characters?.[index]?.tools?.[4]?.rawName !== 'Blank'
          ? state?.characters?.[index]?.tools?.[4]
          : null;
        let maxTraps = usedTrap
          ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + plusOneTrap
          : trapSlots.length;
        maxTraps = Math.min(maxTraps, 8);
        const crittersPercentBonus = calcCrittersBonus({
          currentCharacterIndex: index,
          account: state?.account,
          characters: state?.characters,
          isExp: false
        });
        const expPercentBonus = calcCrittersBonus({
          currentCharacterIndex: index,
          account: state?.account,
          characters: state?.characters,
          isExp: false
        });
        const realTraps = trapSlots.length >= maxTraps ? trapSlots : fillArrayToLength(maxTraps, trapSlots);
        const charTotals = trapSlots.reduce((total, { crittersQuantity, trapExp, rawName }) => {
          return {
            ...total,
            [rawName]: {
              critters: (total?.[rawName]?.critters ?? 0) + (crittersQuantity * crittersPercentBonus),
              exp: (total?.[rawName]?.exp ?? 0) + (trapExp * expPercentBonus)
            }
          }
        }, {});
        return <React.Fragment key={`printer-row-${index}`}>
          <Card sx={{ width: { lg: 920, xl: 'fit-content' } }}>
            <CardContent>
              <Stack direction="row" alignItems={'center'} gap={2} flexWrap={'wrap'}>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', md: 'row' } }}
                           alignItems={'center'} gap={2}>
                      <Stack alignItems={'center'} justifyContent={'center'}>
                        <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                        <img style={{ height: 38 }} src={`${prefix}data/${trap?.rawName}.png`} alt=""/>
                      </Stack>
                      <Stack>
                        <Typography className={'character-name'}>{playerName}</Typography>
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
                                  title={<TrapTooltip {...slot?.trapData} trapExp={slot?.trapExp * expPercentBonus}
                                                      crittersQuantity={slot?.crittersQuantity * crittersPercentBonus}/>}>
                                  <FloatingItemIcon src={`${prefix}data/TrapBoxSet${slot?.trapType + 1}.png`} alt=""/>
                                </Tooltip>
                                <ItemIcon src={`${prefix}data/${slot?.rawName}.png`} alt=""/>
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
  return <Stack direction={'row'} mt={2} mb={index === 'total' ? 2 : 1} gap={2}>
    <CardTitleAndValue variant={outlined ? 'outlined' : 'elevation'} title={'Totals'}>
      <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
        {Object.entries(array).map(([critterName, { critters, exp }], totalIndex) => {
          return <Stack alignItems={'center'} gap={1} key={`total-${index}-${totalIndex}-${critterName}`}
                        direction={'row'}>
            <ItemIcon src={`${prefix}data/${critterName}.png`} alt=""/>
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
  width: 42px;
  height: 42px;
`

const FloatingItemIcon = styled.img`
  z-index: 1;
  width: 42px;
  height: 42px;
`

export default Traps;
