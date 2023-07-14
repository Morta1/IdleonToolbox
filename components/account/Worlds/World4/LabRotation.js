import { getChipsAndJewels } from '../../../../parsers/cooking';
import React, { useContext, useState } from 'react';
import { AppContext } from '../../../common/context/AppProvider';
import { Autocomplete, Card, CardContent, Stack, TextField, Typography, useMediaQuery } from '@mui/material';
import { format, isValid } from 'date-fns';
import { cleanUnderscore, notateNumber, prefix } from '../../../../utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../../../Tooltip';
import { calculateItemTotalAmount } from '../../../../parsers/items';

const LabRotation = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const [value, setValue] = useState([]);
  const rotations = getChipsAndJewels(state?.account);
  const names = [...state?.account?.lab?.chips, ...state?.account?.lab?.jewels];
  return <>
    <Stack sx={{ mb: 3 }}>
      <Autocomplete
        size={'small'}
        multiple
        limitTags={isSm ? 2 : 3}
        value={value}
        onChange={(event, newValue) => setValue(newValue)}
        disablePortal
        id="combo-box-demo"
        options={names}
        sx={{ width: { xs: 300, sm: 700 } }}
        filterSelectedOptions
        getOptionLabel={(option) => {
          return option ? cleanUnderscore(option?.name) : '';
        }}
        renderOption={(props, option) => {
          return option ? (
            <Stack gap={2} {...props} key={'option-' + option?.rawName} direction={'row'}>
              <img
                width={24}
                height={24}
                src={`${prefix}data/${option?.rawName}.png`}
                alt=""
              />
              {option?.name?.replace(/_/g, ' ')}
            </Stack>
          ) : <span style={{ height: 0 }} key={'empty'}/>
        }}
        renderInput={(params) => <TextField {...params} label="Filter by jewel or chip"/>}
      />
    </Stack>
    <Stack gap={2}>
      {rotations?.map(({ items, date }, rotationIndex) => {
        if (value.length > 0) {
          const exists = items?.some(({ name }) => value.map(({ name }) => name).includes(name));
          if (!exists) {
            return null;
          }
        }
        return <Card key={'rotation' + rotationIndex} sx={{ width: 'fit-content' }}>
          <CardContent sx={{ '&:last-child': { p: 3 } }}>
            <Stack key={'rotation' + rotationIndex} gap={2} flexWrap={'wrap'}>
              <Typography sx={{ textAlign: 'center' }} variant={'h6'}>{isValid(date)
                ? format(date, 'dd/MM/yyyy HH:mm:ss')
                : null}</Typography>
              <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                {items?.map(({ name, requirements = [], rawName, index, bonus, effect, baseVal }, itemsIndex) => {
                  const desc = rawName?.includes('Chip') ? bonus.replace(/{/g, baseVal) : effect.replace(/}/g, bonus);
                  return <Card variant={'outlined'} sx={{ width: 250 }} key={'items' + itemsIndex}>
                    <CardContent sx={{ '&:last-child': { p: 3 } }}>
                      <Stack alignItems={'center'} gap={2}>
                        <Tooltip title={cleanUnderscore(desc)}>
                          <Stack direction={'row'} alignItems={'center'} gap={1}>
                            <Icon src={`${prefix}data/${rawName ? rawName : `ConsoleChip${index}`}.png`} alt=""/>
                            <Typography>{cleanUnderscore(name)}</Typography>
                          </Stack>
                        </Tooltip>
                        <Stack direction={'row'} gap={2}>
                          {requirements?.map(({ name, rawName, amount }, reqIndex) => {
                            let totalAmount;
                            if (rawName.includes('Spice')) {
                              const spice = state?.account?.cooking?.spices?.available?.find(({ rawName: sRawName }) => sRawName === rawName);
                              totalAmount = spice?.amount || 0;
                            } else if (rawName.includes('CookingM')) {
                              const meal = state?.account?.cooking?.meals?.find(({ name: mName }) => mName === name)
                              totalAmount = meal?.amount || 0;
                            } else {
                              totalAmount = calculateItemTotalAmount(state?.account?.storage, rawName, true, true);
                            }
                            return <Stack alignItems={'center'} gap={1} key={`req-${rawName}-${reqIndex}`}>
                              <Tooltip title={cleanUnderscore(name)}>
                                <Icon src={`${prefix}data/${rawName}.png`} alt=""/>
                              </Tooltip>
                              <Tooltip title={`${notateNumber(amount)} / ${notateNumber(totalAmount)}`}>
                                <Typography color={amount < totalAmount
                                  ? 'success.light'
                                  : 'error.light'}>{notateNumber(amount)}</Typography>
                              </Tooltip>
                            </Stack>
                          })}
                        </Stack>
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
  </>
};

const Icon = styled.img`
  width: 42px;
  height: 42px;
  object-fit: contain;
`

export default LabRotation;
