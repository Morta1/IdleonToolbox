import {
  Autocomplete,
  Card,
  CardContent,
  Chip,
  createFilterOptions,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '../../utility/helpers';
import { itemsArray } from '../../data/website-data';
import Button from '@mui/material/Button';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '../../components/Tooltip';
import { findQuantityOwned, getAllItems } from '../../parsers/items';
import { AppContext } from '../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import IconButton from '@mui/material/IconButton';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});
const MaterialTracker = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const [value, setValue] = useState([]);
  const [threshold, setThreshold] = useState('');
  const [note, setNote] = useState('');
  const [hoverIcons, setHoverIcons] = useState({});
  const [trackedItems, setTrackedItems] = useState(JSON.parse(localStorage.getItem('material-tracker')) || {});
  const items = useMemo(() => itemsArray.filter(({
                                                   itemType,
                                                   typeGen,
                                                   displayName
                                                 }) => displayName !== 'ERROR' && displayName !== 'Blank' &&
    displayName !== 'Filler' && displayName !== 'DONTFILL' && displayName !== 'FILLER' && itemType !== 'Equip' && !typeGen.includes('Quest')
  ), []);
  const totalOwnedItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters,
    state?.account]);
  const [errors, setErrors] = useState({ material: false, threshold: false });

  const handleAddThreshold = () => {
    const tempErrors = {};
    if (value.length === 0) {
      tempErrors.material = true;
    }
    const tempThreshold = threshold?.replace(/,/g, '');
    if (!threshold || isNaN(tempThreshold)) {
      tempErrors.threshold = true;
    }
    if (tempErrors?.material || tempErrors?.threshold) {
      setErrors(tempErrors);
      return;
    }
    const updated = { ...trackedItems };
    value.forEach((item) => {
      updated[item?.rawName] = {
        item,
        threshold: parseInt(tempThreshold),
        note
      }
    })
    setTrackedItems(updated)
    // Save to local storage
    localStorage.setItem('material-tracker', JSON.stringify(updated));
    // Reset fields
    setValue([]);
    setThreshold('');
    setNote('');
  }

  const handleDeleteThreshold = (rawName) => {
    const updated = { ...trackedItems };
    delete updated[rawName];
    setTrackedItems(updated);
    setHoverIcons({})
    // Save to local storage
    localStorage.setItem('material-tracker', JSON.stringify(updated));
  }

  return (
    <>
      <NextSeo
        title="Idleon Toolbox | Material Tracker"
        description="Add a material, set your own threshold and keep track of your inventory."
      />
      <Stack>
        <Autocomplete
          id="material tracker"
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            setErrors({ ...errors, material: false })
          }}
          multiple
          options={[...items]}
          filterSelectedOptions
          disableCloseOnSelect
          filterOptions={filterOptions}
          getOptionLabel={(option) => {
            return option?.displayName ? option?.displayName?.replace(/_/g, ' ') : '';
          }}
          sx={{ width: isSm ? '100%' : 600, mb: 3, flexShrink: 1 }}
          renderTags={(tag, getTagProps) => {
            return tag.map((option, index) => (
              <Chip
                key={index}
                icon={<img width={24} height={24} src={`${prefix}data/${option?.rawName}.png`} alt={''}/>}
                label={option?.displayName?.replace(/_/g, ' ')}
                {...getTagProps({ index })}
              />
            ))
          }}
          renderOption={(props, option) => {
            if (!option) return null;
            return <Stack {...props} key={props.id} gap={2} direction={'row'}>
              <img
                key={`img-${props.id}`}
                width={24}
                height={24}
                src={`${prefix}data/${option?.rawName}.png`}
                alt=""
              />
              <Typography key={`text-${props.id}`}>{option?.displayName?.replace(/_/g, ' ')}</Typography>
            </Stack>
          }}

          renderInput={(params) => (
            <TextField {...params}
                       error={errors?.material}
                       label="Material name" variant="outlined"/>
          )}
        />
      </Stack>
      <Stack justifyContent={isSm ? 'space-between' : 'flex-start'} direction={'row'} gap={3} alignItems={'center'} flexWrap={'wrap'}>
        <TextField error={errors?.threshold} value={threshold} onChange={({ target }) => {
          let temp = target.value.replace(/,/g, '');
          setThreshold(numberWithCommas(temp))
          setErrors({ ...errors, threshold: false })
        }} label="Threshold"/>
        <TextField value={note} onChange={({ target }) => setNote(target.value)} label="Note"/>
        <Button onClick={handleAddThreshold} sx={{ height: 'fit-content' }} variant={'contained'}>Add threshold</Button>
      </Stack>
      <Stack mt={3} direction={isSm ? 'column' : 'row'} gap={3} flexWrap={'wrap'}>
        {(Object.values(trackedItems))?.map(({ item, threshold, note }, index) => {
          const { amount: quantityOwned } = findQuantityOwned(totalOwnedItems, item?.displayName);
          let color, twoPercentBuffer = threshold * 0.02;
          if (quantityOwned < threshold) {
            color = 'error.light';
          } else if (quantityOwned <= threshold + twoPercentBuffer) {
            color = 'warning.main';
          } else {
            color = 'success.main';
          }
          return <Card key={`tracked-item-${index}`}>
            <CardContent>
              <Stack direction={isSm ? 'row' : 'column'}
                     alignItems={'center'}
                     justifyContent={isSm ? 'space-between' : 'flex-start'}
                     gap={isSm ? 3 : 0}
                     flexWrap={'wrap'}
                     sx={{ position: 'relative' }}
                     onMouseEnter={() => setHoverIcons({
                       ...hoverIcons,
                       [index]: true
                     })}
                     onMouseLeave={() => setHoverIcons({
                       ...hoverIcons,
                       [index]: false
                     })}>
                {hoverIcons?.[index] ? <IconButton onClick={() => handleDeleteThreshold(item?.rawName)}
                                                   sx={{ position: 'absolute', top: isSm ? 0 : -10, left: -10 }}>
                  <DeleteForeverIcon/>
                </IconButton> : null}
                <img style={isSm ? { marginLeft: 16 } : {}} width={48} height={48}
                     src={`${prefix}data/${item?.rawName}.png`}
                     alt=""/>
                <Stack direction={'row'} gap={2}>
                  {note && isSm ? <Tooltip title={note}>
                    <InfoIcon/>
                  </Tooltip> : null}
                  <Typography>{cleanUnderscore(item?.displayName)}</Typography>
                  {note && !isSm ? <Tooltip title={note}>
                    <InfoIcon/>
                  </Tooltip> : null}
                </Stack>
                <Typography
                  color={color}
                  mt={isSm ? 0 : 1}>{notateNumber(quantityOwned)}/{notateNumber(threshold)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};

export default MaterialTracker;
