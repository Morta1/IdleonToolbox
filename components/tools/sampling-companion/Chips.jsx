import { Box, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, titleCaseName } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';
import { isSectionFailed } from '@components/common/styles';

const Chips = ({ chips, account, character }) => {
  // A failed lab section can't say what a character holds: no count, no grey
  const labFailed = isSectionFailed(account, 'lab');
  return <Panel title={'Chips'}>
    <Box sx={{ p: 2 }}>
      <CardGrid size={'icon'} fill>
        {chips?.map(({ chip, count }, index) => {
          const { name, index: chipIndex } = chip || {};
          const chipList = account?.lab?.playersChips?.[character?.playerId] || [];
          const chipCount = chipList.filter(({ index: cIndex }) => cIndex === chipIndex).length;
          return <IconTile key={`${name}-${index}`} icon={`data/ConsoleChip${chip?.index}.png`}
                           alt={titleCaseName(cleanUnderscore(name))}
                           value={labFailed ? undefined : `${chipCount} / ${count}`}
                           status={!labFailed && chipCount < count ? 'missing' : undefined}
                           details={<ChipDetails {...chip}/>}/>;
        })}
      </CardGrid>
    </Box>
  </Panel>;
};

const ChipDetails = ({ name, bonus, baseVal }) => <>
  <Typography variant={'cardTitle'} component={'div'} sx={{ mb: 0.5 }}>{titleCaseName(cleanUnderscore(name))}</Typography>
  <Typography variant={'body2'}>{cleanUnderscore(bonus?.replace(/{/g, baseVal) ?? '')}</Typography>
</>;

export default Chips;
