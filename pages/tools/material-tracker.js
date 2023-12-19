import { Autocomplete, Stack, TextField, Typography } from '@mui/material';
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

const MaterialTracker = () => {
  const { state } = useContext(AppContext);
  const [value, setValue] = useState('');
  const [threshold, setThreshold] = useState('');
  const [note, setNote] = useState('');
  const [hoverIcons, setHoverIcons] = useState({});
  const [trackedItems, setTrackedItems] = useState(JSON.parse(localStorage.getItem('material-tracker')) || {});
  const items = useMemo(() => itemsArray.filter(({ itemType }) => itemType !== 'Equip' && itemType !== 'Quest'), []);
  const totalOwnedItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters,
    state?.account]);
  const [errors, setErrors] = useState({ material: false, threshold: false });

  const handleAddThreshold = () => {
    const tempErrors = {};
    if (!value) {
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
    const updated = { ...trackedItems, [value.rawName]: { item: value, threshold: parseInt(tempThreshold), note } };
    setTrackedItems(updated)
    // Save to local storage
    localStorage.setItem('material-tracker', JSON.stringify(updated));
    // Reset fields
    setValue('');
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
      <Stack direction={'row'} gap={3} alignItems={'center'} flexWrap={'wrap'}>
        <Autocomplete
          id="material tracker"
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            setErrors({ ...errors, material: false })
          }}
          autoComplete
          options={[value, ...items]}
          filterSelectedOptions
          getOptionLabel={(option) => {
            return option?.displayName ? option?.displayName?.replace(/_/g, ' ') : '';
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
          style={{ width: 300 }}
          renderInput={(params) => (
            <TextField {...params}
                       error={errors?.material}
                       InputProps={{
                         ...params.InputProps,
                         startAdornment: value?.rawName ? <img width={24} height={24}
                                                               src={`${prefix}data/${value?.rawName}.png`}/> : null
                       }}
                       label="Material name" variant="outlined"/>
          )}
        />
        <TextField error={errors?.threshold} value={threshold} onChange={({ target }) => {
          let temp = target.value.replace(/,/g, '');
          setThreshold(numberWithCommas(temp))
          setErrors({ ...errors, threshold: false })
        }} label="Threshold"/>
        <TextField value={note} onChange={({ target }) => setNote(target.value)} label="Note"/>
        <Button onClick={handleAddThreshold} sx={{ height: 'fit-content' }} variant={'contained'}>Add threshold</Button>
      </Stack>
      <Stack direction={'row'} gap={3}>
        {(Object.values(trackedItems))?.map(({ item, threshold, note }, index) => {
          const { amount: quantityOwned, owner } = findQuantityOwned(totalOwnedItems, item?.displayName);
          let color, twoPercentBuffer = threshold * 0.02;
          if (quantityOwned < threshold) {
            color = 'error.light';
          } else if (quantityOwned <= threshold + twoPercentBuffer) {
            color = 'warning.main';
          } else {
            color = 'success.main';
          }
          return <Stack key={`tracked-item-${index}`} direction={'column'} alignItems={'center'}
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
                                               sx={{ position: 'absolute', left: -10 }}>
              <DeleteForeverIcon/>
            </IconButton> : null}
            <img src={`${prefix}data/${item?.rawName}.png`} alt=""/>
            <Stack direction={'row'} gap={2}>
              <Typography>{cleanUnderscore(item?.displayName)}</Typography>
              {note ? <Tooltip title={note}>
                <InfoIcon/>
              </Tooltip> : null}
            </Stack>
            <Typography
              color={color}
              mt={1}>{notateNumber(quantityOwned)}/{notateNumber(threshold)}</Typography>
          </Stack>
        })}
      </Stack>
    </>
  );
};

export default MaterialTracker;
