import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { dustNames } from '@parsers/class-specific/compass';
import { monsterSprite } from '@utility/spriteImages';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// A saved checkbox from before resets once ("Hide coined monsters", "Show wind walker drops": the drops are in each
// medallion's details now)
const MEDALLIONS_TOOLBAR = { search: '', found: 'all', dust: 'all' };

// abominations: the section's list, whose weaknesses name the elements (the parser keeps its element names to itself).
// sectionFailed: the catalog at zero by name, with no found state, no coin and no Toolbar.
// A fact's value led by its game icon, on the value's own line
const iconValue = (src, text) => <Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5} justifyContent={'flex-end'}>
  <GameIcon src={src} size={20} alt={''}/>{text}
</Stack>;

const Medallions = ({ medallions, totalAcquiredMedallions, abominations, sectionFailed }) => {
  const [view, setView, resetView] = useToolbarState('compass-medallions', MEDALLIONS_TOOLBAR);
  const catalog = medallions ?? [];
  const elementName = (index) => abominations?.find(({ weakness }) => weakness?.index === index)?.weakness?.name;
  const found = catalog.filter(({ acquired }) => acquired).length;
  const dustTypes = Object.keys(dustNames).filter((type) => catalog.some(({ dustType }) => `${dustType}` === type));
  // Search reads the medallion's monster and where it is found
  const search = (view?.search ?? '').trim().toLowerCase();
  const shown = sectionFailed ? catalog : catalog.filter(({ acquired, dustType, Name, rawName, description }) => (view?.found === 'found' ? acquired
    : view?.found === 'missing' ? !acquired : true) && (view?.dust === 'all' || `${dustType}` === view?.dust)
    && (!search || cleanUnderscore(`${Name ?? rawName ?? ''} ${description ?? ''}`).toLowerCase().includes(search)));
  return <Stack gap={3}>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'Medallions found'}
                value={sectionFailed ? '-' : `${formatNum(totalAcquiredMedallions ?? found)} / ${formatNum(catalog.length)}`}/>
    </Stack>
    {sectionFailed ? null : <Toolbar state={view} defaults={MEDALLIONS_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={catalog.length} shown={shown.length} noun={'medallions'}>
      <Toolbar.Search placeholder={'Search medallions'}/>
      <Toolbar.Show name={'found'} label={'Medallions'} options={[['all', 'All medallions', catalog.length], ['found', 'Found', found],
        ['missing', 'Not found', catalog.length - found]]}/>
      <Toolbar.Show name={'dust'} label={'Dusts'} options={[['all', 'All dusts', catalog.length],
        ...dustTypes.map((type) => [type, cleanUnderscore(dustNames[type]), catalog.filter(({ dustType }) => `${dustType}` === type).length])]}/>
    </Toolbar>}
    {/* Dust, weakness and drops in plain view, each by its game icon, as the cards had them before the redesign: behind a
        tile's tap they read as gone */}
    {shown.length ? <CardGrid size={'s'}>
      {shown.map(({ Name, rawName, imageName, acquired, description, drops, weakness, dustType, dustBaseQuantity }) => {
        const name = cleanUnderscore(Name ?? rawName ?? '');
        const element = elementName(weakness);
        const dustName = cleanUnderscore(dustNames[dustType] ?? 'Dust');
        return <ItemCard key={rawName ?? Name} icon={monsterSprite(imageName)} iconAlt={name} title={name}
                         meta={description ? cleanUnderscore(description) : undefined}
                         dimmed={!sectionFailed && !acquired}
                         aside={!sectionFailed && acquired ? <GameIcon src={'data/WWcoin.png'} size={24} alt={'Medallion found'}/> : null}>
          <ItemCard.Facts rows={[
            [dustName, iconValue(`data/Dust${dustType}_x1.png`, `${formatGame(dustBaseQuantity ?? 0, 'Windwalker.CompassDustQTYbase')} per kill`)],
            element ? ['Weak to', iconValue(`data/WWeffect${weakness}.png`, cleanUnderscore(element))] : null,
            drops?.length ? ['Drops', <Stack key={'drops'} component={'span'} direction={'row'} gap={0.5} flexWrap={'wrap'}
                                              justifyContent={'flex-end'}>
              {drops.map((item, index) => {
                const itemName = cleanUnderscore(item?.displayName ?? item?.rawName ?? '');
                return <NoteTrigger key={`${item?.rawName}-${index}`} note={itemName} label={itemName}>
                  <GameIcon src={`data/${item?.rawName}.png`} size={28} alt={itemName}/>
                </NoteTrigger>;
              })}
            </Stack>] : null
          ]}/>
        </ItemCard>;
      })}
    </CardGrid> : null}
  </Stack>;
};

export default Medallions;
