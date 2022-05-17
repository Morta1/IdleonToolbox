import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { AppContext } from "../../../components/common/context/AppProvider";
import { notateNumber, prefix } from "../../../utility/helpers";
import styled from "@emotion/styled";

const Printer = () => {
  const { state } = useContext(AppContext);
  const { printer, lab } = state?.account;

  const wiredInBonus = lab?.labBonuses?.find((bonus) => bonus.name === 'Wired_In')?.active;

  return <>
    <Typography variant={'h2'} mb={3}>Printer</Typography>
    <Stack gap={3}>
      {printer?.map((printerSlots, index) => {
        const charClassName = state?.characters?.[index]?.class;
        const playerName = state?.characters?.[index]?.name;
        const labBonusActive = state?.characters?.[index]?.afkTarget === 'Laboratory' && wiredInBonus;
        return <Card sx={{ width: 'fit-content' }} key={`printer-row-${index}`}>
          <CardContent>
            <Stack direction='row' alignItems={'center'} gap={3}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', sm: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}icons/${charClassName}_Icon.png`} alt=""/>
                </Stack>
                <Typography className={'character-name'}>{playerName}</Typography>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
                {printerSlots?.map((slot, slotIndex) => {
                  return <Card sx={{ borderColor: slot?.active ? 'success.light' : 'inherit' }}
                               elevation={slot?.active ? 0 : 5}
                               key={`${slot?.name}-${slotIndex}`} variant={slot?.active ? 'outlined' : 'elevation'}>
                    <CardContent>
                      {slot?.item !== 'Blank' ?
                        <Stack sx={{ width: 50, height: 50 }} position={'relative'} justifyContent={'flex-start'}
                               alignItems={'center'}>
                          <ItemIcon src={`${prefix}data/${slot?.item}.png`} alt=""/>
                          <Typography
                            color={slot?.active && labBonusActive ? 'multiLight' : ''}>{notateNumber(slot?.value, 'Big')}</Typography>
                        </Stack> :
                        <Stack sx={{ width: 50, height: 50 }} alignItems={'center'}
                               justifyContent={'center'}><Typography
                          variant={'caption'}>EMPTY</Typography></Stack>}
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

const ItemIcon = styled.img`
  width: 42px;
  height: 42px;
`

export default Printer;
