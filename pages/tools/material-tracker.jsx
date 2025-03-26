import {
  Autocomplete,
  Card,
  CardContent,
  Checkbox,
  Chip,
  createFilterOptions,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { cleanUnderscore, handleDownload, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { itemsArray } from '../../data/website-data';
import Button from '@mui/material/Button';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '../../components/Tooltip';
import { findQuantityOwned, getAllItems } from '@parsers/items';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import FileUploadButton from '@components/common/DownloadButton';
import { CardTitleAndValue } from '@components/common/styles';
import { IconFileExport } from '@tabler/icons-react';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});
const MaterialTracker = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const [value, setValue] = useState([]);
  const [includeNearly, setIncludeNearly] = useState(false);
  const [bounds, setBounds] = useState({ lowerBound: '', upperBound: '' });
  const [note, setNote] = useState('');
  const [hoverIcons, setHoverIcons] = useState({});
  const [trackedItems, setTrackedItems] = useState(JSON.parse(localStorage.getItem('material-tracker')) || {});
  const items = useMemo(() => itemsArray.filter(({
                                                   itemType,
                                                   typeGen,
                                                   displayName
                                                 }) => displayName !== 'ERROR' && displayName !== 'Blank' &&
    displayName !== 'Filler' && displayName !== 'DONTFILL' && displayName !== 'FILLER' && itemType !== 'Equip'
  ), []);
  const totalOwnedItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters,
    state?.account]);
  const [errors, setErrors] = useState({ material: false, lowerBound: false, upperBound: false });

  const handleAddTracker = (allGreenStacks) => {
    const greenStacks = totalOwnedItems.filter(({ amount }) => amount >= 10e6);
    const tempErrors = {};
    if (value.length > 0 || (allGreenStacks && greenStacks.length > 0)) {
      tempErrors.material = false;
    } else {
      tempErrors.material = true;
    }
    const tempLowerBound = bounds?.lowerBound?.replace(/,/g, '');
    const tempUpperBound = bounds?.upperBound?.replace(/,/g, '');
    if (tempLowerBound && tempUpperBound && tempLowerBound === tempUpperBound) {
      tempErrors.lowerBound = true;
      tempErrors.upperBound = true;
    }
    if (tempErrors?.material || tempErrors?.lowerBound || tempErrors?.upperBound) {
      setErrors(tempErrors);
      return;
    }
    const updated = { ...trackedItems };
    (allGreenStacks ? greenStacks : value).forEach((item) => {
      updated[item?.rawName] = {
        item,
        lowerBound: tempLowerBound ? parseInt(tempLowerBound) : '',
        upperBound: tempUpperBound ? parseInt(tempUpperBound) : '',
        includeNearly,
        note
      }
    })
    setTrackedItems(updated)
    // Save to local storage
    localStorage.setItem('material-tracker', JSON.stringify(updated));
    // Reset fields
    setValue([]);
    setBounds({ lowerBound: '', upperBound: '' });
    setNote('');
  }

  const handleDeleteTracker = (rawName) => {
    const updated = { ...trackedItems };
    delete updated[rawName];
    setTrackedItems(updated);
    setHoverIcons({})
    // Save to local storage
    localStorage.setItem('material-tracker', JSON.stringify(updated));
  }

  const handleEdit = (rawName) => {
    const { lowerBound, upperBound, note } = trackedItems?.[rawName];
    const itemFromItems = items?.find(({ rawName: name }) => name === rawName);
    const alreadyExist = value?.find(({ rawName: name }) => name === rawName);
    if (alreadyExist) return;
    setValue([...value, itemFromItems]);
    const tempLowerBound = (lowerBound || '').toString().replace(/,/g, '');
    const tempUpperBound = (upperBound || '').toString().replace(/,/g, '');
    setBounds({
      lowerBound: numberWithCommas(tempLowerBound || ''),
      upperBound: numberWithCommas(tempUpperBound || '')
    })
    setNote(note);
  }

  return (<>
    <NextSeo
      title="Material Tracker | Idleon Toolbox"
      description="Add a material, set your own threshold and keep track of your inventory."
    />
    <CardTitleAndValue title={'Utility'}>
      <Stack sx={{ mt: 1 }} direction={'row'} alignItems={'center'} gap={2}>
        <FileUploadButton onFileUpload={(data) => {
          setTrackedItems(data);
        }}>Import</FileUploadButton>
        <Button onClick={() => handleDownload(trackedItems, 'it-material-tracker')} variant={'outlined'}
                startIcon={<IconFileExport size={18}/>}
                size="small">Export</Button>
      </Stack>
    </CardTitleAndValue>
    <Stack mb={3} direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
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
        sx={{ width: isSm ? '100%' : 600, flexShrink: 1 }}
        renderTags={(tag, getTagProps) => {
          return tag.map((option, index) => (
            <Chip
              key={index}
              icon={<img width={24} height={24} src={`${prefix}data/${option?.rawName}.png`} alt={''}/>}
              label={option?.displayName?.replace(/_/g, ' ')}
              {...getTagProps({ index })}
            />
          ));
        }}
        renderOption={(props, option) => {
          if (!option) return null;
          return (
            (<Stack {...props} key={props.id} gap={2} direction={'row'}>
              <img
                key={`img-${props.id}`}
                width={24}
                height={24}
                src={`${prefix}data/${option?.rawName}.png`}
                alt="item-icon"
              />
              <Typography key={`text-${props.id}`}>{option?.displayName?.replace(/_/g, ' ')}</Typography>
            </Stack>)
          );
        }}

        renderInput={(params) => (
          <TextField {...params}
                     size={'small'}
                     error={errors?.material}
                     label="Material name" variant="outlined"/>
        )}
      />
    </Stack>
    <Stack justifyContent={isSm ? 'space-between' : 'flex-start'} direction={'row'} gap={3} alignItems={'center'}
           flexWrap={'wrap'}>
      <TextField size={'small'} error={errors?.lowerBound} value={bounds?.lowerBound} onChange={({ target }) => {
        let temp = target.value.replace(/,/g, '');
        setBounds({ ...bounds, lowerBound: numberWithCommas(temp) })
        setErrors({ ...errors, lowerBound: false })
      }} label="Lower bound"/>
      <TextField size={'small'} error={errors?.upperBound} value={bounds?.upperBound} onChange={({ target }) => {
        let temp = target.value.replace(/,/g, '');
        setBounds({ ...bounds, upperBound: numberWithCommas(temp) })
        setErrors({ ...errors, upperBound: false })
      }} label="Upper bound"/>
      <TextField size={'small'} value={note} onChange={({ target }) => setNote(target.value)} label="Note"/>
    </Stack>
    <Stack mt={2} gap={1}>
      <FormControlLabel
        sx={{ width: 'fit-content' }}
        control={<Checkbox checked={includeNearly} onChange={() => setIncludeNearly(!includeNearly)}/>}
        label="Show an alert when value is near the bounds"
      />
      <Stack direction={'row'} alignItems={'center'}
             divider={<Divider orientation={'vertical'} flexItem/>} gap={2}>
        <Button onClick={() => handleAddTracker()} sx={{ height: 'fit-content', width: 'fit-content' }}
                variant={'contained'}>Add
          tracker</Button>
        <Button onClick={() => handleAddTracker(true)} sx={{ height: 'fit-content', width: 'fit-content' }}
                variant={'contained'}

                color={'secondary'}>Add tracker for all greenstacks</Button>
      </Stack>
    </Stack>
    <Stack>
      <Typography mt={2} variant={'caption'}>Conditions:</Typography>
      <List dense={true}>
        <ListItem><Typography variant={'caption'}>Only lower bound set - alert when the item is below the
          bound</Typography></ListItem>
        <ListItem><Typography variant={'caption'}>Only upper bound set - alert when the item is above the
          bound</Typography></ListItem>
        <ListItem><Typography variant={'caption'}>Upper &gt; Lower - alert when the item is outside
          bounds</Typography></ListItem>
      </List>
      <Typography variant={'caption'} mt={2}>* Exceeding the set bounds will trigger an alert in the
        dashboard</Typography>
      <Typography variant={'caption'}>* Leaving the bounds inputs blank will always show the material in the
        dashboard</Typography>
    </Stack>
    <Stack mt={3} direction={isSm ? 'column' : 'row'} gap={1} flexWrap={'wrap'}>
      {(Object.values(trackedItems))?.map(({ item, lowerBound, upperBound, note }, index) => {
        const { amount: quantityOwned } = findQuantityOwned(totalOwnedItems, item?.displayName);
        return <Stack key={`tracked-item-${index}`}
                      onMouseEnter={() => setHoverIcons({ [index]: true })}
                      onMouseLeave={() => setHoverIcons({ [index]: false })}>
          <Card sx={{ width: isSm ? '100%' : 220 }}>
            <CardContent>
              <Stack direction={'row'}
                     alignItems={'center'}
                     gap={isSm ? 2 : 1}
                     flexWrap={'wrap'}
                     sx={{ position: 'relative' }}>
                <img style={{ marginLeft: -8 }} width={48} height={48}
                     src={`${prefix}data/${item?.rawName}.png`}
                     alt="item-icon"/>
                <Stack>
                  <Stack direction={'row'} gap={2}>
                    {note && isSm ? <Tooltip title={note}>
                      <InfoIcon/>
                    </Tooltip> : null}
                    <Typography sx={{
                      width: note ? 80 : 120,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}>{cleanUnderscore(item?.displayName)}</Typography>
                    {note && !isSm ? <Tooltip title={note}>
                      <InfoIcon/>
                    </Tooltip> : null}
                  </Stack>
                  <Typography sx={{ fontSize: 14 }}>Owned: {notateNumber(quantityOwned)}</Typography>
                </Stack>
              </Stack>
              <Stack sx={{ width: '100%' }} direction={'row'} justifyContent={'space-between'}
                     alignItems={'center'}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: 14 }}
                  color={'text.secondary'}
                >{lowerBound ? notateNumber(lowerBound) : 'X'}</Typography>
                <Box sx={{ color: 'text.secondary' }}>~</Box>
                <Typography
                  sx={{ fontWeight: 500, fontSize: 14 }}
                  color={'text.secondary'}
                >{upperBound ? notateNumber(upperBound) : 'X'}</Typography>
              </Stack>
            </CardContent>
          </Card>
          <Stack sx={{ minHeight: 34, mt: 1 }} direction={'row'} justifyContent={'center'}>
            {hoverIcons?.[index] ? <>
              <IconButton size={'small'} onClick={() => handleDeleteTracker(item?.rawName)}>
                <DeleteForeverIcon/>
              </IconButton>
              <IconButton size={'small'} onClick={() => handleEdit(item?.rawName)}>
                <EditIcon/>
              </IconButton>
            </> : null}
          </Stack>
        </Stack>
      })}
    </Stack>
  </>);
};

export default MaterialTracker;
