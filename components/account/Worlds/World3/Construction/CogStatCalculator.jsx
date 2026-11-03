import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { getCharacterByHighestSkillLevel } from '../../../../../parsers/misc';
import { AppContext } from '../../../../common/context/AppProvider';
import { formatNum } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';
import DataTable from '@components/common/DataTable';

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
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <StatTile label={'Highest construction level'} value={formatNum(level)}/>
        <StatTile label={'Construction value'} value={formatNum(mainConstructionValue, 'amount', { precise: true })}/>
      </Stack>
      <Stack gap={0.5}>
        <Typography variant={'caption'} color={'text.secondary'}>Cog type</Typography>
        <ToggleButtonGroup exclusive value={cogType} aria-label={'Cog type'}
                           onChange={(event, next) => (next != null ? setCogType(Number(next)) : null)}>
          {COG_TYPES.map(([value, label]) => <ToggleButton key={value} value={value}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ width: { xs: '100%', sm: 'fit-content' }, maxWidth: '100%' }}>
        <DataTable fits columns={COLUMNS} rows={rows} rowKey={'stat'} surface={'card'}/>
      </Box>
    </Stack>
  )
};

export default CogStatCalculator;
