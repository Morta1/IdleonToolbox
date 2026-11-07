import { Stack } from '@mui/material';
import { useContext, useState } from 'react';
import { getCharacterByHighestSkillLevel } from '../../../../../parsers/misc';
import { AppContext } from '../../../../common/context/AppProvider';
import { formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import DataTable from '@components/common/DataTable';
import ViewSwitch from '@components/common/ViewSwitch';

const COG_TYPES = [[2, 'Nooby'], [3, 'Decent'], [4, 'Superb'], [5, 'Ultimate']];

const COLUMNS = [
  { key: 'stat', label: 'Stat', value: ({ stat }) => stat },
  { key: 'min', label: 'Min', numeric: true, value: ({ min }) => min, render: ({ min, precise }) => formatNum(min, 'amount', { precise }) },
  { key: 'max', label: 'Max', numeric: true, value: ({ max }) => max, render: ({ max, precise }) => formatNum(max, 'amount', { precise }) }
];

// A cog's EXP stat from its construction value, as the game rolls it
const expOf = (value) => Math.max(Math.floor((Math.pow(value, 0.4) + Math.log10(value) * 10) - 5), 2);

const CogStatCalculator = () => {
  const { state } = useContext(AppContext);
  const [cogType, setCogType] = useState(5);
  // A guest has no character: the calculator answers for level 0 instead of NaN
  const level = getCharacterByHighestSkillLevel(state?.characters, '', 'construction')?.skillsInfo?.construction?.level ?? 0;
  const mainConstructionValue = Math.pow(((level / 3) + 0.7), (1.3 + (0.05 * cogType))) / 4 + Math.pow(3, cogType - 2);
  const constructionMin = mainConstructionValue * .4;
  const constructionMax = mainConstructionValue * 3;
  const rows = [
    { stat: 'Construction value', min: constructionMin, max: constructionMax, precise: true },
    { stat: 'Build rate', min: Math.floor(constructionMin), max: Math.floor(constructionMax) },
    { stat: 'Flag rate', min: Math.round(Math.pow(constructionMin, 0.8)), max: Math.round(Math.pow(constructionMax, 0.8)) },
    { stat: 'EXP', min: expOf(constructionMin), max: expOf(constructionMax) }
  ];

  return (
    <Stack gap={2} sx={{ mb: 3 }}>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <StatTile label={'Highest construction level'} value={formatNum(level)}/>
        {/* The value a cog of this type centres on (the old page's "main"); the table's row is the range it rolls in */}
        <StatTile label={'Main construction value'} value={formatNum(mainConstructionValue, 'amount', { precise: true })}/>
      </Stack>
      <Panel title={'Cog stat calculator'} sx={{ width: { xs: '100%', sm: 'fit-content' }, maxWidth: '100%' }}>
        <Panel.Inputs>
          <Panel.InputGroup label={'Cog type'}>
            <ViewSwitch size={'medium'} label={'Cog type'} options={COG_TYPES} value={cogType} onChange={setCogType}/>
          </Panel.InputGroup>
        </Panel.Inputs>
        <DataTable fits columns={COLUMNS} rows={rows} rowKey={'stat'}/>
      </Panel>
    </Stack>
  )
};

export default CogStatCalculator;
