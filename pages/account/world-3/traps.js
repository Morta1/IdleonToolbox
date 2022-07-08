import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { fillArrayToLength, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Timer from "components/common/Timer";
import Tooltip from "../../../components/Tooltip";
import { TitleAndValue } from "../../../components/common/styles";

const Traps = () => {
  const { state } = useContext(AppContext);
  const { traps } = state?.account || {};
  return <>
    <Typography variant={'h2'} mb={3}>Traps</Typography>
    <Stack gap={3}>
      {traps?.map((trapSlots, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const usedTrap = state?.characters?.[index]?.tools?.[4]?.rawName !== 'Blank' ? state?.characters?.[index]?.tools?.[4] : null;
        const maxTraps = usedTrap ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + 1 : 0;
        const realTraps = trapSlots.length === maxTraps ? trapSlots : fillArrayToLength(maxTraps, trapSlots);
        return <Card key={`printer-row-${index}`} sx={{ width: { lg: 920, xl: 'fit-content' } }}>
          <CardContent>
            <Stack direction='row' alignItems={'center'} gap={2}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', md: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                </Stack>
                <Typography className={'character-name'}>{playerName}</Typography>
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
                              <Tooltip title={<TrapTooltip {...slot?.trapData}/>}>
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
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

const TrapTooltip = ({ quantity, exp, trapType }) => {
  return <>
    <TitleAndValue title={'Quantity'} value={`x${quantity}`}/>
    <TitleAndValue title={trapType === 0 ? 'Exp' : 'Shiny'} value={`x${exp}`}/>
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
