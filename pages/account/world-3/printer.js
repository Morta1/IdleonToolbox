import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { notateNumber, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Tooltip from "../../../components/Tooltip";
import { TitleAndValue } from "../../../components/common/styles";

const Printer = () => {
  const { state } = useContext(AppContext);
  const { printer, lab } = state?.account;

  const wiredInBonus = lab?.labBonuses?.find((bonus) => bonus.name === 'Wired_In')?.active;

  return <>
    <Typography variant={'h2'} mb={3}>Printer</Typography>
    <Typography variant={'caption'} component={'div'} mb={3}>* hover over items to see boosted values</Typography>
    <Stack gap={3}>
      {printer?.map((printerSlots, index) => {
        const classIndex = state?.characters?.[index]?.classIndex;
        const playerName = state?.characters?.[index]?.name;
        const labBonusActive = (state?.characters?.[index]?.afkTarget === 'Laboratory' || state?.account?.divinity?.linkedDeities?.[index] === 1) && wiredInBonus;
        return <Card sx={{ width: 'fit-content' }} key={`printer-row-${index}`}>
          <CardContent>
            <Stack direction='row' alignItems={'center'} gap={3}>
              <Stack sx={{ width: 175, textAlign: 'center', flexDirection: { xs: 'column', sm: 'row' } }}
                     alignItems={'center'} gap={2}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                </Stack>
                <Typography className={'character-name'}>{playerName}</Typography>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
                {printerSlots?.map((slot, slotIndex) => {
                  return <Tooltip key={`${slot?.name}-${slotIndex}`} title={<BoostedTooltip {...slot}/>}>
                    <Card sx={{ borderColor: slot?.active ? 'success.light' : 'inherit' }}
                          elevation={slot?.active ? 0 : 5}

                          variant={slot?.active ? 'outlined' : 'elevation'}>
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
                  </Tooltip>
                })}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

const BoostedTooltip = ({ value, boostedValue, affectedBy }) => {
  return <Stack>
    <TitleAndValue boldTitle title={'Base value'} value={notateNumber(value, 'Big')}/>
    <TitleAndValue boldTitle title={'Boosted value'} value={notateNumber(boostedValue, 'Big')}/>
    {affectedBy.length > 0 ? <Stack>
      <Typography mt={1} sx={{ fontWeight: 'bold' }} variant={'subtitle1'}>Affected by:</Typography>
      {affectedBy?.map((by) => <Typography key={by} fontSize={14}>{by}</Typography>)}
    </Stack> : null}
  </Stack>
}

const ItemIcon = styled.img`
  width: 42px;
  height: 42px;
`

export default Printer;
