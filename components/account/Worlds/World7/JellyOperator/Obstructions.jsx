import React from 'react';
import { Box } from '@mui/material';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// The next obstruction first: removed ones are a click away
const OBSTRUCTIONS_TOOLBAR = { search: '', show: 'notRemoved' };

// Decision 12: an obstruction's HP has no gameNotation key, so the amount kind
const Obstructions = ({ obstructions, max }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('jelly-obstructions', OBSTRUCTIONS_TOOLBAR);
  // "Nothing yet" obstructions are real fights with no reward so far: they count toward the next one too. The game's
  // last list entry is past its max, so the list stops where the "removed" count does
  const released = (obstructions ?? []).filter(({ index }) => index < (max ?? Infinity));
  const notRemoved = released.filter(({ defeated }) => !defeated);
  // With every obstruction removed there is no next one: the list shows them all, and the switch goes away
  const byProgress = toolbar?.show === 'all' || !notRemoved.length ? released : notRemoved;
  // Search reads the name and the reward
  const search = (toolbar?.search ?? '').trim().toLowerCase();
  const shown = search ? byProgress.filter(({ name, description }) => `${name ?? ''} ${description ?? ''}`.toLowerCase().includes(search))
    : byProgress;
  const nextIndex = notRemoved[0]?.index;
  return <Box>
    <Toolbar state={toolbar} defaults={OBSTRUCTIONS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={released.length} shown={shown.length} noun={'obstructions'}>
      <Toolbar.Search placeholder={'Search obstructions'}/>
      {notRemoved.length
        ? <Toolbar.Show options={[['notRemoved', 'Not removed', notRemoved.length], ['all', 'All', released.length]]}/>
        : null}
    </Toolbar>
    <CardGrid size={'m'}>
      {shown.map(({ index, name, description, defeated, hp, time }) => <ItemCard key={index} icon={`data/JellyOp${index}.png`}
                                                                              title={name}
                                                                              status={defeated ? 'done' : index === nextIndex ? 'active' : undefined}
                                                                              statusLabel={defeated ? 'Removed' : 'Next'}
                                                                              dimmed={!defeated && index !== nextIndex}
                                                                              meta={`${formatNum(hp ?? 0)} HP · ${time}s`}>
        <ItemCard.Desc text={description?.replace(/\n/g, '@')}/>
      </ItemCard>)}
    </CardGrid>
  </Box>;
};

export default Obstructions;
