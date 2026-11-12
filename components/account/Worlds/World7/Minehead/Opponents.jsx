import React from 'react';
import { Box } from '@mui/material';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { getMineheadOpponentSpriteId } from '@parsers/world-7/minehead';

// The next opponent first: beaten ones are a click away
const OPPONENTS_TOOLBAR = { show: 'notBeaten' };

const Opponents = ({ opponents }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('minehead-opponents', OPPONENTS_TOOLBAR);
  const list = opponents ?? [];
  const notBeaten = list.filter((opponent) => !opponent?.beaten);
  const shown = toolbar?.show === 'all' ? list : notBeaten;
  const nextIndex = notBeaten[0]?.index;
  return <Box>
    <Toolbar state={toolbar} defaults={OPPONENTS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={list.length} shown={shown.length} noun={'opponents'}>
      <Toolbar.Show options={[['notBeaten', 'Not beaten', notBeaten.length], ['all', 'All', list.length]]}/>
    </Toolbar>
    <CardGrid size={'m'}>
  {shown.map((opponent, position) => {
    const { index, name, ordinal, title, maxHP, minesCount, bonusDescription, beaten } = opponent ?? {};
    return <ItemCard key={index ?? position} icon={`data/MineH${getMineheadOpponentSpriteId(index)}.png`}
                     title={cleanUnderscore(name)} meta={`${title}, ${ordinal} opponent`}
                     status={beaten ? 'done' : index === nextIndex ? 'active' : undefined}
                     statusLabel={beaten ? 'Beaten' : 'Next'} dimmed={!beaten && index !== nextIndex}>
      <ItemCard.Facts rows={[
        ['Max HP', formatGame(maxHP ?? 0, 'Minehead.MaxHP_Opp')],
        ['Depth charges', formatGame(minesCount ?? 0, 'Minehead.Mines_Opp', { whole: true })]
      ]}/>
      {bonusDescription
        ? <ItemCard.Section label={'Reward'}><ItemCard.Desc text={bonusDescription}/></ItemCard.Section>
        : null}
    </ItemCard>;
  })}
    </CardGrid>
  </Box>;
};

export default Opponents;
