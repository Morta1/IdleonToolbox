import React, { useContext } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getSoulsBonuses, getSoulsReward, getTotemExpReward, getTotems } from '@parsers/world-3/worship';
import { getBestActiveCharacter } from '@parsers/talents';
import StatTile from '@components/common/cards/StatTile';
import DataTable from '@components/common/DataTable';
import withBreakdown from '@components/common/DataTable/withBreakdown';
import GameIcon from '@components/common/GameIcon';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';

// Three totems carry the game's placeholder names; these are the names their maps show.
const TOTEM_NAMES = { 5: 'Citric Conflict', 6: 'Breezy Battle', 7: 'Pufferblob Brawl' };
const totemName = ({ index, name }) => cleanUnderscore(TOTEM_NAMES[index] ?? name);
const expText = ({ expReward }) => formatGame(expReward?.value ?? 0, 'WorshipStuff.ExpRewards');

const COLUMNS = [
  {
    key: 'totem', label: 'Totem', value: totemName,
    icon: ({ index }) => <GameIcon src={`etc/totem_${index}.png`} alt={''} size={24}/>
  },
  { key: 'map', label: 'Map', value: ({ map }) => cleanUnderscore(map) },
  { key: 'maxWave', label: 'Max wave', numeric: true, sortable: true, value: ({ maxWave }) => maxWave || 0, kind: 'amount' },
  {
    key: 'expPerWave', label: 'EXP per wave', numeric: true, sortable: true,
    value: ({ expReward }) => expReward?.value ?? 0,
    render: expText,
    // The drawer is named for its totem and headed with the cell's text
    wrap: withBreakdown((totem) => (totem?.expReward?.breakdown
      ? { ...totem.expReward.breakdown, totalValue: expText(totem) }
      : undefined), (totem) => `${totemName(totem)} EXP per wave`)
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

// The table's prices, in Worship's gear under the tab's name (not remembered before they moved there)
export const TOTEMS_SETTINGS = { worshipEff: null, foodEff: null, worshipper: null };
// A wave's EXP uses the Worship EXP multi of the character fighting it, the logged-in one by default
const defaultWorshipper = (characters) => getBestActiveCharacter(characters) ?? characters?.[0];

export const TotemsSettings = ({ characters }) => <PageSettings.Group title={'Totems'}>
  <PageSettings.Number name={'worshipEff'} label={'Worship efficiency'} defaultValue={0} min={0}/>
  <PageSettings.Number name={'foodEff'} label={'Food effect'} defaultValue={0} min={0}/>
  {characters?.length ? <PageSettings.Select name={'worshipper'} label={'Worshipper'} defaultValue={defaultWorshipper(characters)?.name}
                                             options={characters.map(({ name, classIndex }) => [name, <Stack key={name} component={'span'}
                                               direction={'row'} alignItems={'center'} gap={1}>
                                               <GameIcon src={`data/ClassIcons${classIndex}.png`} alt={''} size={24}/>
                                               {name}
                                             </Stack>])}/> : null}
</PageSettings.Group>;

// totemsFailed: a failed section lists the totems at zero (the parser's catalog with no save). The max waves total is
// the totems' own waves (towers reads them from the same save field), so either failed section shows no number there
const Totems = ({ totemsFailed, towersFailed }) => {
  const { state } = useContext(AppContext);
  const [settings] = usePageSettings('worship', TOTEMS_SETTINGS);
  const worshipEff = settings?.worshipEff ?? 0;
  const foodEff = settings?.foodEff ?? 0;
  const soulsBonuses = getSoulsBonuses(state?.account, state?.characters);
  const characters = state?.characters ?? [];
  const worshipper = characters.find(({ name }) => name === settings?.worshipper) ?? defaultWorshipper(characters);
  const totems = state?.account?.totems?.length ? state.account.totems : totemsFailed ? getTotems({}) : [];
  // Each totem's reward priced once for the chosen worshipper, so the rows rebuild when it changes.
  const rows = totems.map((totem, index) => ({
    ...totem,
    index,
    expReward: getTotemExpReward(totem, index, worshipper, characters, state?.account),
    souls: getSoulsReward({ ...totem, efficiency: worshipEff, foodEffect: foodEff, bonuses: soulsBonuses }) || 0
  }));

  return (
    <>
      <StatTile label={'Total max waves'} icon={'etc/totem_0.png'} kind={'amount'} sx={{ mb: 2 }}
                value={towersFailed || totemsFailed ? '-' : state?.account?.towers?.totalWaves ?? 0}/>
      {rows.length ? <DataTable columns={COLUMNS} rows={rows} rowKey={'index'} rowLabel={totemName} surface={'card'}/> : null}
    </>
  );
};

export default Totems;
