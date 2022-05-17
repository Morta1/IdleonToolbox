import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { AppContext } from "../../../components/common/context/AppProvider";
import { prefix } from "../../../utility/helpers";
import styled from "@emotion/styled";
import Timer from "../../../components/common/Timer";

const Traps = () => {
  const { state } = useContext(AppContext);
  const { traps } = state?.account;
  return <>
    <Typography variant={'h2'} mb={3}>Traps</Typography>
    <Stack gap={3}>
      {traps?.map((trapSlots, index) => {
        const charClassName = state?.characters?.[index]?.class;
        const playerName = state?.characters?.[index]?.name;
        return <Card key={`printer-row-${index}`} sx={{ width: { lg: 920, xl: 'fit-content' } }}>
          <CardContent>
            <Stack direction='row' alignItems={'center'} gap={2}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', md: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}icons/${charClassName}_Icon.png`} alt=""/>
                </Stack>
                <Typography className={'character-name'}>{playerName}</Typography>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={3}>
                {trapSlots?.map((slot, slotIndex) => {
                  return slot?.name ?
                    <Card sx={{ borderColor: slot?.active ? 'success.light' : 'inherit', }} elevation={5}
                          key={`${slot?.rawName || 'trap'}-${slotIndex}`}>
                      <CardContent>
                        <Stack sx={{ width: { xs: 65, sm: 80 }, height: 50 }} position={'relative'}
                               justifyContent={'flex-start'}
                               alignItems={'center'}>
                          <ItemIcon src={`${prefix}data/${slot?.rawName}.png`} alt=""/>
                          <Timer type={'countdown'} date={slot?.timeLeft}
                                 lastUpdated={state?.lastUpdated}/>
                        </Stack>
                      </CardContent>
                    </Card> : <Stack sx={{ width: 112, height: 82 }}/>
                })}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

const ItemIcon = styled.img`
  width: 42px;
  height: 42px;
`

export default Traps;
