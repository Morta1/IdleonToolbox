import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import MultiCharLockText from '@components/common/MultiCharLockText';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// A saved checkbox from before resets once ("Hide portals I can't hit", "Detailed view")
const PORTALS_TOOLBAR = { reachable: false, detailed: false };

// One section per portal. Maps with two get two, told apart by where each door leads.
const portalSection = ({ portalIndex, reqKills, destinationName, secondsToClear, buffedSecondsToClear, reachable, multiCharLock },
  showDoor, runUnlocked) => <ItemCard.Section key={portalIndex}
                                              label={showDoor ? destinationName ? `Door to ${cleanUnderscore(destinationName)}` : `Portal ${portalIndex + 1}` : undefined}>
  <ItemCard.Facts rows={[
    ['Kills needed', formatNum(reqKills)],
    ['Clear time', reachable ? formatDuration(secondsToClear) : 'Can\'t hit this monster'],
    reachable && runUnlocked ? ['With Void Radius', formatDuration(buffedSecondsToClear)] : null
  ]}/>
  <MultiCharLockText lock={multiCharLock}/>
</ItemCard.Section>;

const Portals = ({ character, plan, emptyAccount }) => {
  const [view, setView, resetView] = useToolbarState('speedrun-portals', PORTALS_TOOLBAR);

  if (!character) {
    return emptyAccount
      ? <Notice tone={'signin'}>Your Voidwalker&apos;s portals and their clear times show here once you sign in.</Notice>
      : <Notice tone={'locked'}>Create a Voidwalker to see your portal costs.</Notice>;
  }

  const all = plan?.portals ?? [];
  const visible = all.filter(({ reachable }) => !view?.reachable || reachable);

  // Grouped by world, maps in the game's own order. Any other ordering would read as a route, and
  // the real one turns on travel, unlocks and buff timing as much as on kill cost.
  const worlds = visible.reduce((result, portal) => {
    const world = result[portal.world] ?? (result[portal.world] = new Map());
    const existing = world.get(portal.mapIndex);
    if (existing) {
      existing.portals.push(portal);
    }
    else {
      world.set(portal.mapIndex, { ...portal, portals: [portal] });
    }
    return result;
  }, {});

  return <Stack gap={3}>
    <Toolbar state={view} defaults={PORTALS_TOOLBAR} onChange={setView} onReset={resetView}
             total={all.length} shown={visible.length} noun={'portals'}>
      <Toolbar.Filter name={'reachable'} label={'Hide portals I can\'t hit'}/>
      <Toolbar.Filter name={'detailed'} label={'Detailed view'}/>
    </Toolbar>
    <Stack gap={3} aria-label="speedrun portals">
      {Object.entries(worlds).map(([world, maps]) => <Stack key={world} gap={1.5}>
        <Typography variant={'sectionTitle'} component={'h2'}>World {world}</Typography>
        <CardGrid size={'s'}>
          {[...maps.values()].map(({ mapIndex, mapName, monster, effectiveKillsPerSecond, reachable, portals }) => <ItemCard
            key={mapIndex} icon={`data/Mface${monster?.MonsterFace}.png`} title={cleanUnderscore(mapName ?? '')}
            meta={reachable ? `${formatNum(effectiveKillsPerSecond)} portal progress per second` : 'Out of reach'}>
            {view?.detailed
              ? portals.map((portal) => portalSection(portal, portals.length > 1, plan?.runUnlocked))
              : portals.map(({ portalIndex, multiCharLock }) => <MultiCharLockText key={portalIndex} lock={multiCharLock}/>)}
          </ItemCard>)}
        </CardGrid>
      </Stack>)}
    </Stack>
  </Stack>;
};

export default Portals;
