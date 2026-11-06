import { Autocomplete, Box, Button, createFilterOptions, Divider, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import React, { useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import GameIcon from '@components/common/GameIcon';
import NumberField from '@components/common/NumberField';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});

const FIELD_SX = { flex: '1 1 160px', minWidth: 0 };
const FIELDS = [
  ['dropRate', 'Drop rate', 'Enter your drop rate'],
  ['killsWithMultikill', 'Kills with multikill', 'Enter your kills'],
  ['multiKillBonus', 'Multikill bonus', 'Enter your multikill bonus']
];

const GuaranteedDropCalculator = () => {
  const [value, setValue] = useState(null);
  // monsterDrops is 2.08MB and feeds one Autocomplete on this page alone. Imported statically
  // it sits on the critical path; loaded here it arrives after first paint and the options
  // fill in. Imported by path rather than through @website-data so the barrel doesn't pull
  // the rest of the data set along with it.
  const [monsterDrops, setMonsterDrops] = useState(null);
  useEffect(() => {
    let cancelled = false;
    import('../../data/website-data/monsterDrops.json')
      .then((mod) => { if (!cancelled) setMonsterDrops(mod.default); });
    return () => { cancelled = true; };
  }, []);
  const items = monsterDrops === null ? [] : Object.values(monsterDrops).flat().filter((monster) => monster?.rawName !== 'COIN' && !monster?.rawName?.includes('DungCredits') && monster?.chance > 0);

  // Group by monster
  const groupedItems = items.reduce((acc, item) => {
    const monsterName = item.monsterDisplayName || item.monsterRawName;
    if (!acc[monsterName]) {
      acc[monsterName] = [];
    }
    acc[monsterName].push(item);
    return acc;
  }, {});

  const [values, setValues] = useState({ dropRate: null, killsWithMultikill: null, multiKillBonus: null });
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState([]);
  const handleCalc = () => {
    const tempErrors = {};
    if (!value) tempErrors.material = true;
    FIELDS.forEach(([name]) => {
      if (values[name] === null) tempErrors[name] = true;
    });
    setErrors(tempErrors);
    if (Object.keys(tempErrors).length) return;
    const kills = Math.round(values.killsWithMultikill / (1 + (values.multiKillBonus / 100)));
    const variable = kills * parseFloat(value?.chance) * values.dropRate;
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
    <NextSeo
      title="Guaranteed Drop Calculator | Idleon Toolbox"
      description="Calculate guaranteed drop rates and required kills for any monster drop in Legends of Idleon with multikill bonuses"
    />
    <StructuredData data={createHowToData(
      'How to calculate guaranteed drops in Legends of Idleon',
      'Use the Guaranteed Drop Calculator to find how many kills you need for a guaranteed item drop.',
      [
        'Search and select a monster from the dropdown to see its drop table',
        'Enter your drop rate bonus percentage and multikill bonus',
        'Click Calculate to see the number of kills required for each guaranteed drop',
        'Review the results showing guaranteed drop thresholds for each item'
      ]
    )}/>
    <Panel title={'Guaranteed drop'}>
      <Stack gap={2} sx={{ p: 2 }}>
        <Typography variant={'body2'} color={'text.secondary'}>
          This does not include values from the 2x kills lab bonus or the god bonus in W5 (divide the kills input by 4 if
          both bonuses apply), kill-per-kill talents, prayers, or bubbles.
        </Typography>
        <Panel.Inputs sx={{ p: 0, alignItems: 'flex-start' }}>
          <Autocomplete
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
              setErrors({ ...errors, material: false });
            }}
            options={Object.values(groupedItems).flat()}
            loading={monsterDrops === null}
            loadingText={'Loading monster drops'}
            groupBy={(option) => option?.monsterDisplayName || option?.monsterRawName}
            filterSelectedOptions
            filterOptions={filterOptions}
            getOptionLabel={(option) => cleanUnderscore(option?.displayName ?? '')}
            sx={{ flex: '2 1 280px', minWidth: 0 }}
            renderGroup={(params) => <li key={params.key}>
              <Typography variant={'groupLabel'} component={'div'} color={'text.secondary'}
                          sx={{ px: 2, py: 1, bgcolor: 'background.default', position: 'sticky', top: -8, zIndex: 1 }}>
                {cleanUnderscore(params.group)}
              </Typography>
              <ul style={{ padding: 0 }}>{params.children}</ul>
            </li>}
            renderOption={({ key, ...props }, option) => <Stack component={'li'} key={key} {...props} direction={'row'} gap={1.5}>
              <GameIcon src={`data/${option?.rawName}.png`} size={24} alt={''}/>
              <span>
                {cleanUnderscore(option?.displayName ?? '')}
                <Box component={'span'} sx={{ color: 'text.secondary', ml: 0.75 }}>{formatNum(option?.chance, 'odds')}</Box>
              </span>
            </Stack>}
            renderInput={(params) => <TextField {...params} label={'Material'} error={Boolean(errors?.material)}
                                                helperText={errors?.material ? 'Pick a material' : undefined}/>}
          />
          {FIELDS.map(([name, label, ask]) => <NumberField
            key={name} label={label} sx={FIELD_SX} min={0} help={false} value={values[name]}
            unit={name === 'multiKillBonus' ? '%' : undefined}
            error={errors?.[name] ? ask : null}
            onChange={(next) => {
              setValues((prev) => ({ ...prev, [name]: next }));
              setErrors((prev) => ({ ...prev, [name]: false }));
            }}/>)}
          {/* The fields carry their labels above: the button lines up with their boxes */}
          <Button variant={'contained'} onClick={handleCalc} sx={{ mt: '24px' }}>Run</Button>
        </Panel.Inputs>
        {results?.length > 0 ? <>
          <Divider/>
          <ItemCard.Facts rows={results.map(({ breakpoint, hours }) => [`x${breakpoint} drop`, formatDuration(hours * 3600)])}/>
        </> : null}
      </Stack>
    </Panel>
  </>);
};

export default GuaranteedDropCalculator;
