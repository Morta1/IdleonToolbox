import { Autocomplete, Button, Chip, createFilterOptions, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import React, { useMemo, useState } from 'react';
import { monsterDrops } from '@website-data';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});
const GuaranteedDropCalculator = () => {
  const [value, setValue] = useState(null);
  const items = useMemo(() => Object.values(monsterDrops).flat().filter((monster) => monster?.rawName !== 'COIN' && !monster?.rawName?.includes('DungCredits') && monster?.chance > 0), []);
  const groupedItems = useMemo(() => {
    const items = Object.values(monsterDrops)
      .flat()
      .filter((monster) => monster?.rawName !== 'COIN' && !monster?.rawName?.includes('DungCredits') && monster?.chance > 0);

    // Group by monster
    const grouped = items.reduce((acc, item) => {
      const monsterName = item.monsterDisplayName || item.monsterRawName;
      if (!acc[monsterName]) {
        acc[monsterName] = [];
      }
      acc[monsterName].push(item);
      return acc;
    }, {});

    return grouped;
  }, [monsterDrops]);

  const [values, setValues] = useState({
    dropRate: '',
    killsWithMultikill: '',
    multiKillBonus: ''
  });
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState([]);
  const handleChange = ({ target }) => {
    const { name, value } = target;
    const temp = value.replace(/,/g, '');
    setErrors(prev => ({ ...prev, [name]: false }))
    setValues(prev => ({ ...prev, [name]: numberWithCommas(temp) }))
  }
  const handleCalc = () => {
    const tempErrors = {};
    if (!value) {
      tempErrors.material = true;
    }
    const dr = parseFloat(values.dropRate?.replace(/,/g, ''));
    const killsMK = parseFloat(values.killsWithMultikill?.replace(/,/g, ''));
    const mkBonus = parseFloat(values.multiKillBonus?.replace(/,/g, ''));
    if (isNaN(dr) || values.dropRate === '') {
      tempErrors.dropRate = true;
    }
    if (isNaN(killsMK) || values.killsWithMultikill === '') {
      tempErrors.killsWithMultikill = true;
    }
    if (isNaN(mkBonus) || values.multiKillBonus === '') {
      tempErrors.multiKillBonus = true;
    }
    if (tempErrors?.material || tempErrors.dropRate || tempErrors.killsWithMultikill || tempErrors.multiKillBonus) {
      setErrors(tempErrors);
      return;
    }
    const kills = Math.round(killsMK / (1 + (mkBonus / 100)));
    const variable = kills * parseFloat(value?.chance) * dr;
    if (!isNaN(variable)) {
      const breakpoints = [2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chances = [2, 2.51, 3.51, 4.51, 5.51, 6.51, 7.51, 8.51, 9.51];
      setResults(
        breakpoints.map((breakpoint, index) => ({
          breakpoint,
          hours: chances[index] / variable
        }))
      )
    }
  }

  return (<>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} alignItems={'center'}>
      <Autocomplete
        id="drop calc"
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          setErrors({ ...errors, material: false })
        }}
        options={Object.values(groupedItems).flat()}
        groupBy={(option) => option?.monsterDisplayName || option?.monsterRawName}
        filterSelectedOptions
        filterOptions={filterOptions}
        getOptionLabel={(option) => {
          return option?.displayName ? option?.displayName?.replace(/_/g, ' ') : '';
        }}
        sx={{ width: 300 }}
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
        renderGroup={(params) => (
          <li key={params.key}>
            <Typography
              sx={{
                px: 2,
                py: 1,
                fontWeight: 'bold',
                backgroundColor: '#141A21',
                position: 'sticky',
                top: -8,
                zIndex: 1
              }}
            >
              Monster: {cleanUnderscore(params.group)}
            </Typography>
            <ul style={{ padding: 0 }}>{params.children}</ul>
          </li>
        )}
        renderOption={(props, option) => {
          if (!option) return null;
          return (
            <Stack {...props} key={props.id} sx={{ alignItems: 'flex-start !important', pl: 4 }}>
              <Stack direction={'row'} gap={2}>
                <img
                  key={`img-${props.id}`}
                  width={24}
                  height={24}
                  src={`${prefix}data/${option?.rawName}.png`}
                  alt="item-icon"
                />
                <Typography key={`text-${props.id}`}>
                  {option?.displayName?.replace(/_/g, ' ')}
                  <Typography variant={'caption'}> (1 / {Math.ceil(1 / option?.chance)})</Typography>
                </Typography>
              </Stack>
            </Stack>
          );
        }}
        renderInput={(params) => (
          <TextField {...params}
                     size={'small'}
                     error={errors?.material}
                     label="Material name"
                     variant="outlined"/>
        )}
      />
      <TextField size={'small'} error={errors?.dropRate} onChange={handleChange} name={'dropRate'}
                 value={values.dropRate}
                 label={'Drop rate'}/>
      <TextField size={'small'} error={errors?.killsWithMultikill} onChange={handleChange} name={'killsWithMultikill'}
                 value={values.killsWithMultikill}
                 label={'Kills with multi kill'}/>
      <TextField size={'small'} error={errors?.multiKillBonus} onChange={handleChange} name={'multiKillBonus'}
                 value={values.multiKillBonus}
                 label={'Multikill bonus %'}/>
      <Button variant={'contained'} onClick={handleCalc}>Run</Button>
    </Stack>
    <Typography mt={1} variant={'caption'}>* This does not include values from the 2x kills lab bonus or the god bonus
      in W5
      (divide the kills input by 4 if both bonuses apply), kill-per-kill talents, prayers, or bubbles.</Typography>
    {results?.length > 0 ? <Stack mt={2}>
      <Typography variant={'h6'}>Results</Typography>
      {results.map(({ breakpoint, hours }) => <Stack key={'result-' + breakpoint}>
        <Typography>x{breakpoint} drop in {notateNumber(hours, 'MultiplierInfo')} hours</Typography>
      </Stack>)}
    </Stack> : null
    }    </>);
};

export default GuaranteedDropCalculator;
