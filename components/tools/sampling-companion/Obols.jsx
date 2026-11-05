import { Box } from '@mui/material';
import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import ItemDisplay from '@components/common/ItemDisplay';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';

const Obols = ({ obols, character }) => <Panel title={'Obols'}>
  <Box sx={{ p: 2 }}>
    <CardGrid size={'icon'} fill>
      {obols?.map((obol, index) => {
        const { displayName, rawName } = obol || {};
        const isEquipped = character?.obols?.list?.filter(({ displayName: dName }) => dName === displayName)?.length > 0;
        return <IconTile key={`${displayName}-${index}`} icon={`data/${rawName}.png`} fallback={`data/${rawName}_x1.png`}
                         alt={cleanUnderscore(displayName ?? '')} status={isEquipped ? undefined : 'missing'}
                         details={<ItemDisplay {...obol}/>}/>;
      })}
    </CardGrid>
  </Box>
</Panel>;

export default Obols;
