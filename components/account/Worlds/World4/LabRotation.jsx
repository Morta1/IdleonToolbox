import { getChipsAndJewels } from '../../../../parsers/cooking';
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../../common/context/AppProvider';
import {
  Autocomplete,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { format, isValid } from 'date-fns';
import { cleanUnderscore, notateNumber, prefix } from '../../../../utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../../../Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { getRequirementAmount } from '@parsers/lab';

const LabRotation = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const [value, setValue] = useState([]);
  const [weeks, setWeeks] = useState(10);
  const [chipThreshold, setChipThreshold] = useState(0);
  const rotations = useMemo(() => getChipsAndJewels(state?.account, weeks), [state?.account, weeks]);
  const names = useMemo(() => ([...state?.account?.lab?.chips, ...state?.account?.lab?.jewels]), [state?.account]);

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
          ) : <span style={{ height: 0 }} key={'empty' + option?.index}/>;
        }}
        renderInput={(params) => <TextField {...params} label="Filter by jewel or chip"/>}
      />
      <Stack direction={'row'} gap={1}>
        <FormControl sx={{ mt: 2 }} size={'small'}>
          <InputLabel>Weeks</InputLabel>
          <Select label={'Weeks'} sx={{ width: { xs: 100 } }} value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={30}>30</MenuItem>
            <MenuItem value={40}>40</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
        <TextField onChange={(e) => setChipThreshold(e.target.value)}
                   size={'small'} sx={{ mt: 2, width: 200 }}
                   type={'number'} label={'Chip count threshold'}
                   helperText={<Typography sx={{ width: 200 }} variant={'caption'}>This will highlight the chip when
                     your threshold is met</Typography>}/>
      </Stack>
    </Stack>
    <Stack gap={1}>
      {rotations?.map(({ items, date }, rotationIndex) => {
        if (value.length > 0) {
          const exists = items?.some(({ name }) => value.map(({ name }) => name).includes(name));
          if (!exists) {
            return null;
          }
        }
        return (
          (<Card key={'rotation' + rotationIndex} sx={{ width: 'fit-content' }}>
            <CardContent sx={{ '&:last-child': { p: 3 } }}>
              <Stack key={'rotation' + rotationIndex} gap={2} flexWrap={'wrap'}>
                <Typography sx={{ textAlign: 'center' }} variant={'h6'}>{isValid(date)
                  ? format(date, 'dd/MM/yyyy HH:mm:ss')
                  : null}</Typography>
                <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                  {items?.map(({
                                 name,
                                 requirements = [],
                                 rawName,
                                 index,
                                 bonus,
                                 effect,
                                 baseVal,
                                 acquired,
                                 amount: chipCount
                               }, itemsIndex) => {
                    const desc = rawName?.includes('Chip') ? bonus.replace(/{/g, baseVal) : effect.replace(/}/g, bonus);
                    const { currentRotation } = state?.account?.lab;
                    return <Card variant={'outlined'} key={'items' + itemsIndex}
                                 sx={{
                                   width: 250,
                                   borderColor: acquired || chipCount > chipThreshold ? 'success.light' : ''
                                 }}>
                      <CardContent sx={{ '&:last-child': { p: 3 } }}>
                        <Stack alignItems={'center'} gap={2}>
                          <Stack>
                            <Tooltip title={cleanUnderscore(desc)}>
                              <Stack direction={'row'} alignItems={'center'} gap={1}>
                                <Icon src={`${prefix}data/${rawName ? rawName : `ConsoleChip${index}`}.png`} alt=""/>
                                <Typography>{cleanUnderscore(name)}</Typography>
                              </Stack>
                            </Tooltip>
                            {rotationIndex === 0 && index === currentRotation?.[itemsIndex] ? <Typography
                              sx={{ ml: '50px' }} color={'error.light'}>SOLD OUT</Typography> : <span>&nbsp;</span>}
                          </Stack>
                          <Stack direction={'row'} gap={2}>
                            {requirements?.map(({ name, rawName, amount }, reqIndex) => {
                              const totalAmount = getRequirementAmount(name, rawName, state?.account);
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
          </Card>)
        );
      })}
    </Stack>
  </>;
};

const Icon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`

export default LabRotation;
