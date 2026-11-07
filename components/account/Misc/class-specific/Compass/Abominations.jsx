import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// A saved checkbox from before resets once.
const ABOMINATIONS_TOOLBAR = { show: 'all' };

// sectionFailed: the catalog at zero by name (the parser's own empty save), with no killed state and no Toolbar
const Abominations = ({ abominations, sectionFailed }) => {
  const [view, setView, resetView] = useToolbarState('compass-abominations', ABOMINATIONS_TOOLBAR);
  const catalog = abominations ?? [];
  const killed = catalog.filter(({ unlocked }) => unlocked).length;
  const shown = sectionFailed ? catalog : catalog.filter(({ unlocked }) => view?.show === 'killed' ? unlocked
    : view?.show === 'notKilled' ? !unlocked : true);
  return <Stack gap={3}>
    {sectionFailed ? null : <Toolbar state={view} defaults={ABOMINATIONS_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={catalog.length} shown={shown.length} noun={'abominations'}>
      <Toolbar.Show options={[['all', 'All abominations', catalog.length], ['killed', 'Killed', killed],
        ['notKilled', 'Not killed', catalog.length - killed]]}/>
    </Toolbar>}
    {shown.length ? <CardGrid size={'s'}>
      {shown.map((abomination) => {
        const { name, unlocked, weakness, hp, map, world } = abomination;
        const killedNow = !sectionFailed && Boolean(unlocked);
        // The game draws "Titan" + its index + ".png" (N.js:120878)
        return <ItemCard key={name} icon={`data/Titan${catalog.indexOf(abomination)}.png`} title={cleanUnderscore(name)} dimmed={!sectionFailed && !unlocked}
                         meta={`World ${formatNum(world)} · ${cleanUnderscore(map)}`}
                         status={killedNow ? 'done' : undefined} statusLabel={'Killed'}>
          <ItemCard.Facts rows={[
            ['Weakness', <Stack key={'weakness'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
              <GameIcon src={`data/WWeffect${weakness?.index}.png`} size={16} alt={''}/>{cleanUnderscore(weakness?.name ?? '')}
            </Stack>],
            ['HP', formatNum(hp)]
          ]}/>
        </ItemCard>;
      })}
    </CardGrid> : null}
  </Stack>;
};

export default Abominations;
