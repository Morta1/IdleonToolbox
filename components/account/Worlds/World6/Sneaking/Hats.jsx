import React from 'react';
import { Stack } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const HATS_TOOLBAR = { show: 'all' };

// A mastery row's floor reads "2 (mastery 1)"
const floorsText = (floors) => floors?.length ? `Floor ${floors.join(', ')}` : 'Unknown';

// The list loops the hat catalog, so a guest sees every hat as missing
const Hats = ({ hats }) => {
  const [view, setView, resetView] = useToolbarState('sneaking-hats', HATS_TOOLBAR);
  const catalog = hats ?? [];
  const found = catalog.filter(({ found }) => found).length;
  const shown = catalog.filter(({ found }) => view?.show === 'found' ? found : view?.show === 'missing' ? !found : true);
  return <Stack gap={3}>
    <Toolbar state={view} defaults={HATS_TOOLBAR} onChange={setView} onReset={resetView}
             total={catalog.length} shown={shown.length} noun={'hats'}>
      <Toolbar.Show pills options={[['all', 'All', catalog.length], ['found', 'Found', found],
        ['missing', 'Missing', catalog.length - found]]}/>
    </Toolbar>
    {shown.length ? <CardGrid size={'m'}>
      {shown.map(({ rawName, name, description, found, floors }) => (
        <ItemCard key={rawName} icon={`data/${rawName}.png`} title={name} dimmed={!found}
                  status={found ? 'done' : undefined} statusLabel={found ? 'Found' : undefined}>
          <ItemCard.Desc text={description}/>
          <ItemCard.Facts rows={[['Drops on', floorsText(floors)]]}/>
        </ItemCard>
      ))}
    </CardGrid> : null}
  </Stack>;
};

export default Hats;
