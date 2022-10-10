import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext, useMemo } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { fillArrayToLength, kFormatter, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Timer from "components/common/Timer";
import Tooltip from "../../../components/Tooltip";
import { TitleAndValue } from "../../../components/common/styles";

const Traps = () => {
  const { state } = useContext(AppContext);
  const { traps } = state?.account || {};
  const calcTotalCritters = (traps) => {
    return traps?.reduce((res, trapSlots) => {
      trapSlots.reduce((total, { crittersQuantity, rawName }) => {
        res = {
          ...res,
          [rawName]: (res?.[rawName] ?? 0) + crittersQuantity
        }
      }, {});
      return res;
    }, {});
  }
  const totalCritters = useMemo(() => calcTotalCritters(traps), [traps]);

  return <>
    <Typography variant={'h2'} mb={3}>Traps</Typography>
    {totalCritters ? <TotalCritters critters={totalCritters} index={'total'}/> : null}
    <Stack gap={3}>
      {traps?.map((trapSlots, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const trappingLevel = state?.characters?.[index].skillsInfo?.trapping?.level;
        const trap = state?.characters?.[index]?.tools.find(({ name }) => name.includes('Trap'));
        const usedTrap = state?.characters?.[index]?.tools?.[4]?.rawName !== 'Blank' ? state?.characters?.[index]?.tools?.[4] : null;
        const maxTraps = usedTrap ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + 1 : trapSlots.length;
        const realTraps = trapSlots.length >= maxTraps ? trapSlots : fillArrayToLength(maxTraps, trapSlots);
        const charCritters = trapSlots.reduce((total, { crittersQuantity, rawName }) => {
          return {
            ...total,
            [rawName]: (total?.[rawName] ?? 0) + crittersQuantity
          }
        }, {})
        return <React.Fragment key={`printer-row-${index}`}>
          <Card sx={{ width: { lg: 920, xl: 'fit-content' } }}>
            <CardContent>
              <Stack direction='row' alignItems={'center'} gap={2}>
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
                <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={3}>
                  {realTraps?.map((slot, slotIndex) => {
                    return <Card sx={{ borderColor: slot?.active ? 'success.light' : 'inherit', }} elevation={5}
                                 key={`${slot?.rawName || 'trap'}-${slotIndex}`}>
                      <CardContent>
                        <Stack sx={{ width: { xs: 65, sm: 80 }, height: 50 }} position={'relative'}
                               justifyContent={'flex-start'}
                               alignItems={'center'}>
                          {slot?.name ? <>
                              <Stack direction={'row'}>
                                <Tooltip
                                  title={<TrapTooltip {...slot?.trapData} crittersQuantity={slot?.crittersQuantity}/>}>
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
              </Stack>
              <TotalCritters critters={charCritters} index={index}/>
            </CardContent>
          </Card>
        </React.Fragment>
      })}
    </Stack>
  </>;
};

const TotalCritters = ({ critters, index }) => {
  return <Stack direction={'row'} mt={2} mb={index === 'total' ? 2 : 1} gap={2}>
    <Stack
      sx={{ width: index === 'total' ? 'auto' : 175, textAlign: 'center', flexDirection: { xs: 'column', md: 'row' } }}
      alignItems={'center'} gap={2}>
      <Typography className={'character-name'}>Total Critters</Typography>
    </Stack>
    <Card elevation={5} sx={{ width: { lg: 920, xl: 'fit-content' } }}>
      <CardContent>
        <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
          {Object.entries(critters).map(([critterName, quantity], totalIndex) => {
            return <Stack alignItems={'center'} gap={1} key={`total-${index}-${totalIndex}-${critterName}`}
                          direction={'row'}>
              <ItemIcon src={`${prefix}data/${critterName}.png`} alt=""/>
              <Typography>{kFormatter(quantity)}</Typography>
            </Stack>
          })}
        </Stack>
      </CardContent>
    </Card>
  </Stack>
}

const TrapTooltip = ({ quantity, exp, trapType, crittersQuantity }) => {
  return <>
    <TitleAndValue title={'Quantity'} value={`x${quantity}`}/>
    <TitleAndValue title={trapType === 0 ? 'Exp' : 'Shiny'} value={`x${exp}`}/>
    <TitleAndValue title={'Critters'} value={crittersQuantity}/>
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
