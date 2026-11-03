import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { MenuItem, Stack, TextField } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getSoulsBonuses, getSoulsReward, getTotemExpReward, getTotems } from '@parsers/world-3/worship';
import { getBestActiveCharacter } from '@parsers/talents';
import StatTile from '@components/common/cards/StatTile';
import DataTable from '@components/common/DataTable';
import withBreakdown from '@components/common/DataTable/withBreakdown';
import GameIcon from '@components/common/GameIcon';
import NumberField from '@components/common/NumberField';

// Three totems carry the game's placeholder names; these are the names their maps show.
const TOTEM_NAMES = { 5: 'Citric Conflict', 6: 'Breezy Battle', 7: 'Pufferblob Brawl' };
const totemName = ({ index, name }) => cleanUnderscore(TOTEM_NAMES[index] ?? name);
const expText = ({ expReward }) => formatGame(expReward?.value ?? 0, 'WorshipStuff.ExpRewards');

const COLUMNS = [
  {
    key: 'totem', label: 'Totem', value: totemName,
    icon: ({ index }) => <GameIcon src={`etc/totem_${index}.png`} alt={''} size={32}/>
  },
  { key: 'map', label: 'Map', value: ({ map }) => cleanUnderscore(map) },
  { key: 'maxWave', label: 'Max wave', numeric: true, sortable: true, value: ({ maxWave }) => maxWave || 0, kind: 'amount' },
  {
    key: 'expPerWave', label: 'EXP per wave', numeric: true, sortable: true,
    value: ({ expReward }) => expReward?.value ?? 0,
    render: expText,
    // The drawer is named for its totem and headed with the cell's text
    wrap: withBreakdown((totem) => (totem?.expReward?.breakdown
      ? { ...totem.expReward.breakdown, statName: `${totemName(totem)} EXP per wave`, totalValue: expText(totem) }
      : undefined))
  },
  {
    key: 'expPerCharge', label: 'EXP per charge', numeric: true,
    value: ({ expReward, chargeReq }) => Math.floor((expReward?.value ?? 0) / chargeReq) || 0, kind: 'amount'
  },
  {
    key: 'minEfficiency', label: 'Min efficiency', numeric: true, info: 'The worship efficiency a character needs for the souls bonus',
    value: ({ minEfficiency }) => minEfficiency, kind: 'amount'
  },
  {
    key: 'souls', label: 'Souls', numeric: true, sortable: true, value: ({ souls }) => souls,
    render: ({ souls }) => formatGame(souls ?? 0, 'WorshipStuff.SoulRewards')
  }
];

// totemsFailed: a failed section lists the totems at zero (the parser's catalog with no save); towersFailed: the max
// waves total shows no number
const Totems = ({ totemsFailed, towersFailed }) => {
  const { state } = useContext(AppContext);
  const [worshipEff, setWorshipEff] = useState(0);
  const [foodEff, setFoodEff] = useState(0);
  const [selectedName, setSelectedName] = useState(null);
  const soulsBonuses = getSoulsBonuses(state?.account, state?.characters);
  const characters = state?.characters ?? [];
  // A wave's EXP uses the Worship EXP multi of the character fighting it, the logged-in one by default
  const worshipper = characters.find(({ name }) => name === selectedName) ?? getBestActiveCharacter(characters) ?? characters[0];
  const totems = state?.account?.totems?.length ? state.account.totems : totemsFailed ? getTotems({}) : [];
  // Each totem's reward priced once for the chosen worshipper, so the rows rebuild when it changes.
  const rows = totems.map((totem, index) => ({
    ...totem,
    index,
    expReward: getTotemExpReward(totem, index, worshipper, characters, state?.account),
    souls: getSoulsReward({ ...totem, efficiency: worshipEff ?? 0, foodEffect: foodEff ?? 0, bonuses: soulsBonuses }) || 0
  }));

  return (
    <>
      <StatTile label={'Total max waves'} icon={'etc/totem_0.png'} kind={'amount'} cardSx={{ mb: 2 }}
                value={towersFailed ? '-' : state?.account?.towers?.totalWaves ?? 0}/>
      {/* The tab's own settings: they price this table only */}
      <Stack sx={{ mb: 2 }} direction={'row'} alignItems={'flex-start'} gap={2} flexWrap={'wrap'}>
        <NumberField label={'Worship efficiency'} value={worshipEff} min={0} help={false} sx={{ width: 180 }}
                     onChange={(value) => setWorshipEff(value ?? 0)}/>
        <NumberField label={'Food effect'} value={foodEff} min={0} help={false} sx={{ width: 180 }}
                     onChange={(value) => setFoodEff(value ?? 0)}/>
        {characters.length ? <TextField select label={'Worshipper'} value={worshipper?.name ?? ''} sx={{ minWidth: 200 }}
                                        onChange={({ target }) => setSelectedName(target.value)}>
          {characters.map(({ name, classIndex }) => <MenuItem key={name} value={name}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <GameIcon src={`data/ClassIcons${classIndex}.png`} alt={''} size={24}/>
              {name}
            </Stack>
          </MenuItem>)}
        </TextField> : null}
      </Stack>
      {rows.length ? <DataTable columns={COLUMNS} rows={rows} rowKey={'index'} rowLabel={totemName} surface={'card'}/> : null}
    </>
  );
};

export default Totems;
