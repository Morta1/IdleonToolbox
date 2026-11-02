import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import { getSoulsBonuses, getSoulsReward, getTotemExpReward } from '@parsers/world-3/worship';
import { getBestActiveCharacter } from '@parsers/talents';
import { CardTitleAndValue } from '@components/common/styles';
import DataTable from '@components/common/DataTable';
import withBreakdown from '@components/common/DataTable/withBreakdown';
import GameIcon from '@components/common/GameIcon';

// Three totems carry the game's placeholder names; these are the names their maps show.
const TOTEM_NAMES = { 5: 'Citric Conflict', 6: 'Breezy Battle', 7: 'Pufferblob Brawl' };

const COLUMNS = [
  {
    key: 'totem', label: 'Totem', value: ({ index, name }) => cleanUnderscore(TOTEM_NAMES[index] ?? name),
    icon: ({ index }) => <GameIcon src={`etc/totem_${index}.png`} alt={''} size={32}/>
  },
  { key: 'map', label: 'Map', value: ({ map }) => cleanUnderscore(map) },
  { key: 'maxWave', label: 'Max wave', numeric: true, sortable: true, value: ({ maxWave }) => maxWave || 0 },
  {
    key: 'expPerWave', label: 'Exp per wave', numeric: true, sortable: true,
    value: ({ expReward }) => expReward?.value ?? 0,
    render: ({ expReward }) => commaNotation(expReward?.value ?? 0),
    wrap: withBreakdown((totem) => totem?.expReward?.breakdown)
  },
  {
    key: 'expPerCharge', label: 'Exp per charge', numeric: true,
    value: ({ expReward, chargeReq }) => Math.floor((expReward?.value ?? 0) / chargeReq) || 0,
    render: ({ expReward, chargeReq }) => commaNotation(Math.floor((expReward?.value ?? 0) / chargeReq) || 0)
  },
  {
    key: 'minEfficiency', label: 'Min efficiency', numeric: true, info: 'The worship efficiency a character needs for the souls bonus',
    value: ({ minEfficiency }) => minEfficiency, render: ({ minEfficiency }) => commaNotation(minEfficiency)
  },
  { key: 'souls', label: 'Souls', numeric: true, sortable: true, value: ({ souls }) => souls, render: ({ souls }) => commaNotation(souls) }
];

const Totems = () => {
  const { state } = useContext(AppContext);
  const [worshipEff, setWorshipEff] = useState(0);
  const [foodEff, setFoodEff] = useState(0);
  const [selectedName, setSelectedName] = useState(null);
  const soulsBonuses = getSoulsBonuses(state?.account, state?.characters);
  const characters = state?.characters ?? [];
  // A wave's EXP uses the Worship EXP multi of the character fighting it, the logged-in one by default
  const worshipper = characters.find(({ name }) => name === selectedName) ?? getBestActiveCharacter(characters) ?? characters[0];
  // Each totem's reward priced once for the chosen worshipper, so the rows rebuild when it changes.
  const rows = (state?.account?.totems ?? []).map((totem, index) => ({
    ...totem,
    index,
    expReward: getTotemExpReward(totem, index, worshipper, characters, state?.account),
    souls: getSoulsReward({ ...totem, efficiency: worshipEff, foodEffect: foodEff, bonuses: soulsBonuses }) || 0
  }));

  return (
    <>
      <Stack sx={{ my: 3 }} direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
        <TextField size={'small'} value={worshipEff} onChange={({ target }) => setWorshipEff(target.value)}
                   label={'Worship Efficiency'}/>
        <TextField size={'small'} value={foodEff} onChange={({ target }) => setFoodEff(target.value)}
                   label={'Food Effect'}/>
        {characters.length ? <FormControl size={'small'} sx={{ minWidth: 180 }}>
          <InputLabel id={'totem-worshipper-label'}>Worshipper</InputLabel>
          <Select labelId={'totem-worshipper-label'} label={'Worshipper'} value={worshipper?.name ?? ''}
                  onChange={({ target }) => setSelectedName(target.value)}>
            {characters.map(({ name, classIndex }) => <MenuItem key={name} value={name}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt={''} width={24} height={24}/>
                <Typography>{name}</Typography>
              </Stack>
            </MenuItem>)}
          </Select>
        </FormControl> : null}
        <CardTitleAndValue title={'Total Max Waves'} icon={'etc/totem_0.png'} imgStyle={{ width: 24, height: 24 }}
                           value={commaNotation(state?.account?.towers?.totalWaves ?? 0)}/>
      </Stack>
      <DataTable columns={COLUMNS} rows={rows} rowKey={'index'} rowLabel={({ index, name }) => cleanUnderscore(TOTEM_NAMES[index] ?? name)}
                 surface={'card'}/>
    </>
  );
};

export default Totems;
