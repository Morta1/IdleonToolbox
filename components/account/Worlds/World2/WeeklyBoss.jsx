import { cleanUnderscore, prefix } from '@utility/helpers';
import { Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import styled from '@emotion/styled';
import processString from 'react-process-string';
import { format, isValid } from 'date-fns';
import { getTaskQuantity } from '@parsers/world-2/weeklyBosses';

const COLORS = {
  '(ATTACK)': 'error.light',
  '(BUFF)': 'info.light',
  '(MISC)': 'warning.light',
}
const WeeklyBoss = ({ bossIndex, bossName, shopItems, triplets, date, account, characters }) => {
  return (<>
    <Stack sx={{ width: '100%' }} direction={'row'} alignItems={'center'} gap={2}>
      <img style={{ width: 50, height: 50 }} src={`${prefix}etc/${bossName}.png`} alt=""/>
      <Stack>
        <Typography variant={'h4'}>{cleanUnderscore(bossName)}</Typography>
        <Typography variant={'caption'}>{isValid(date) ? format(date, 'dd/MM/yyyy HH:mm:ss') : null}</Typography>
      </Stack>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Typography mb={1} variant={'h5'}>Shop Items</Typography>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {shopItems?.map(({ name, rawName, x1 }) => {
        const fixedRawName = rawName === 'FoodG' ? 'FoodG1' : rawName;
        return <Stack key={rawName} direction={'row'} alignItems={'center'} gap={2}>
          {name.includes('_UI') ? <UiIcon src={`${prefix}data/${fixedRawName}.png`} alt=""/> : <IconImg
            src={`${prefix}data/${fixedRawName}.png`} alt=""/>}
          <Stack>
            <Typography>{cleanUnderscore(name)}</Typography>
            <Stack gap={2} direction={'row'} alignItems={'center'}>
              <Trophie src={`${prefix}data/Trophie.png`} alt=""/>
              <Typography variant={'body1'}>{x1}</Typography>
            </Stack>
          </Stack>
        </Stack>
      })}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack mb={1} direction={'row'} gap={2} alignItems={'center'}>
      <Stack>
        <Typography variant={'h5'}>Actions</Typography>
        {bossIndex === 0 ? <Typography variant={'caption'}>Current
          turn: {account?.accountOptions?.[185] + 1}</Typography> : null}
      </Stack>
      <Stack flexWrap={'wrap'} direction={'row'}>
        {triplets?.map(({ task }, index) => index <= 9 ? <IconImg key={'all-moves' + index}
                                                                  style={{
                                                                    border: bossIndex === 0 && account?.accountOptions?.[185] === index
                                                                      ? '1px solid #81c784'
                                                                      : ''
                                                                  }}
                                                                  src={`${prefix}etc/Req_Icon_${task?.rawName}.png`}
                                                                  alt=""/> : null)}
      </Stack>
    </Stack>
    <Stack>
      {triplets?.map(({ actions, task }, index) => {
        if (index > 9) return null;
        const quantity = getTaskQuantity(index, task?.taskIndex, account, characters);
        return (
          (<React.Fragment key={'triplets' + index}>
            <Stack mb={1} direction={'row'} alignItems={'center'} gap={2}>
              <IconImg src={`${prefix}etc/Req_Icon_${task?.rawName}.png`} alt=""/>
              <Stack>
                <Typography
                  color={bossIndex === 0 && account?.accountOptions?.[185] === index ? 'success.light' : 'text.primary'}
                  variant={'subtitle1'}>{cleanUnderscore(task?.statText?.replace('{', quantity))}</Typography>
                <Typography
                  color={bossIndex === 0 && account?.accountOptions?.[185] === index ? 'success.light' : 'text.primary'}
                  variant={'caption'}>Turn: {index + 1}, by: {characters?.[index]?.name}</Typography>
              </Stack>
            </Stack>
            <Stack gap={2}>
              {actions?.map(({ description }, actionIndex) => {
                return (
                  (<Typography key={'action' + actionIndex} variant={'body2'}>{
                      processString([{
                        regex: /\(Attack\)|\(Buff\)|\(Misc\)/gi,
                        fn: (key, result) => {
                          return <Typography variant={'body2'} component={'span'} key={key + actionIndex}
                                             sx={{ color: COLORS?.[result[0]] }}>{result[0]}</Typography>
                        }
                      }])(cleanUnderscore(description.replace('{', 'X')))}</Typography>)
                );
              })}
            </Stack>
            <Divider sx={{ my: 2 }}/>
          </React.Fragment>)
        );
      })}
    </Stack>
  </>);
};

const Trophie = styled.img`
  width: 15px;
  height: 15px;
  object-fit: contain;
`;

const UiIcon = styled.img`
  width: 35px;
  height: 35px;
  object-fit: none;
  object-position: 0;
`;

const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default WeeklyBoss;
