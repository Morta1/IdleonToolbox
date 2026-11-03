import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { dustNames } from '@parsers/class-specific/compass';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import MultiCharLockText from '@components/common/MultiCharLockText';

// Mining and fishing maps idle on an ore or a fish, which has no monster face
const SKILL_MAP_ICONS = { MINING: 'ClassIconsM', FISHING: 'ClassIcons45' };
// A saved checkbox from before resets once
const PORTALS_TOOLBAR = { hideOpen: false };

// dusts: what each portal's cost is paid from. sectionFailed: the catalog at zero by name, every door's cost and no
// open state, no Toolbar.
const Portals = ({ maps, dusts, sectionFailed }) => {
  const [view, setView, resetView] = useToolbarState('compass-portals', PORTALS_TOOLBAR);
  const catalog = maps ?? [];
  const shown = view?.hideOpen && !sectionFailed ? catalog.filter(({ unlocked }) => !unlocked) : catalog;
  return <Stack gap={3}>
    {sectionFailed ? null : <Toolbar state={view} defaults={PORTALS_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={catalog.length} shown={shown.length} noun={'maps'}>
      <Toolbar.Filter name={'hideOpen'} label={'Hide unlocked'}/>
    </Toolbar>}
    {shown.length ? <CardGrid size={'s'}>
      {shown.map(({ mapName, portals, monster, afkType, unlocked, mapIndex }) => <ItemCard
        key={mapIndex ?? mapName} title={cleanUnderscore(mapName)}
        icon={`data/${SKILL_MAP_ICONS[afkType] ?? `Mface${monster?.MonsterFace}`}.png`}
        status={!sectionFailed && unlocked ? 'done' : undefined} statusLabel={'All unlocked'}>
        {(portals ?? []).map(({ unlocked: open, costType, costQuantity, multiCharLock }, index) => <Stack key={index} gap={0.5}>
          <Stack direction={'row'} alignItems={'center'} gap={0.5}>
            <Typography variant={'body2'} color={'text.secondary'}>{`Portal ${index + 1}`}</Typography>
            <MultiCharLockText lock={multiCharLock} compact label={`portal ${index + 1}'s character lock`}/>
            {!sectionFailed && open ? <Typography variant={'body2'} sx={{ ml: 'auto' }}>Unlocked</Typography> : null}
          </Stack>
          {!sectionFailed && open ? null
            : <ItemCard.Cost icon={`data/Dust${costType}_x1.png`} iconAlt={cleanUnderscore(dustNames[costType] ?? '')}
                             game={'Windwalker.CompassUpgCost'} need={costQuantity}
                             have={sectionFailed ? undefined : dusts?.[costType]?.value ?? 0}/>}
        </Stack>)}
      </ItemCard>)}
    </CardGrid> : null}
  </Stack>;
};

export default Portals;
