import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { dustNames } from '@parsers/class-specific/compass';
import { monsterSprite } from '@utility/spriteImages';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// A saved checkbox from before resets once ("Hide coined monsters", "Show wind walker drops": the drops are in each
// medallion's details now)
const MEDALLIONS_TOOLBAR = { found: 'all', dust: 'all' };

// abominations: the section's list, whose weaknesses name the elements (the parser keeps its element names to itself).
// sectionFailed: the catalog at zero by name, with no found state, no coin and no Toolbar.
const Medallions = ({ medallions, totalAcquiredMedallions, abominations, sectionFailed }) => {
  const [view, setView, resetView] = useToolbarState('compass-medallions', MEDALLIONS_TOOLBAR);
  const catalog = medallions ?? [];
  const elementName = (index) => abominations?.find(({ weakness }) => weakness?.index === index)?.weakness?.name;
  const found = catalog.filter(({ acquired }) => acquired).length;
  const dustTypes = Object.keys(dustNames).filter((type) => catalog.some(({ dustType }) => `${dustType}` === type));
  const shown = sectionFailed ? catalog : catalog.filter(({ acquired, dustType }) => (view?.found === 'found' ? acquired
    : view?.found === 'missing' ? !acquired : true) && (view?.dust === 'all' || `${dustType}` === view?.dust));
  return <Stack gap={3}>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'Medallions found'}
                value={sectionFailed ? '-' : `${formatNum(totalAcquiredMedallions ?? found)} / ${formatNum(catalog.length)}`}/>
    </Stack>
    {sectionFailed ? null : <Toolbar state={view} defaults={MEDALLIONS_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={catalog.length} shown={shown.length} noun={'medallions'}>
      <Toolbar.Show name={'found'} label={'Medallions'} options={[['all', 'All medallions', catalog.length], ['found', 'Found', found],
        ['missing', 'Not found', catalog.length - found]]}/>
      <Toolbar.Show name={'dust'} label={'Dusts'} options={[['all', 'All dusts', catalog.length],
        ...dustTypes.map((type) => [type, cleanUnderscore(dustNames[type]), catalog.filter(({ dustType }) => `${dustType}` === type).length])]}/>
    </Toolbar>}
    {shown.length ? <CardGrid size={'icon'}>
      {shown.map(({ Name, rawName, imageName, acquired, description, drops, weakness, dustType, dustBaseQuantity }) => {
        const name = cleanUnderscore(Name ?? rawName ?? '');
        const perKill = formatGame(dustBaseQuantity ?? 0, 'Windwalker.CompassDustQTYbase');
        const element = elementName(weakness);
        return <IconTile key={rawName ?? Name} icon={monsterSprite(imageName)} alt={name}
                         status={!sectionFailed && !acquired ? 'missing' : undefined}
                         mark={!sectionFailed && acquired ? 'data/WWcoin.png' : undefined} markAlt={'Medallion found'}
                         value={perKill}
                         details={<Stack gap={0.5}>
                           <Typography variant={'body2'}>{`${name}${description ? ` (${cleanUnderscore(description)})` : ''}`}</Typography>
                           <Typography variant={'body2'}>{`${perKill} ${cleanUnderscore(dustNames[dustType] ?? 'dust')} per kill`}</Typography>
                           {element ? <Typography variant={'body2'}>{`Weak to ${cleanUnderscore(element)}`}</Typography> : null}
                           {drops?.length ? <Typography variant={'body2'}>
                             {`Drops ${drops.map((item) => cleanUnderscore(item?.displayName ?? item?.rawName ?? '')).join(', ')}`}
                           </Typography> : null}
                         </Stack>}/>;
      })}
    </CardGrid> : null}
  </Stack>;
};

export default Medallions;
