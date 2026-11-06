import React, { useContext } from 'react';
import { Box, Stack } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { ROYAL_RESOURCE_NAMES } from '@parsers/class-specific/royalGuardian';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { AppContext } from '@components/common/context/AppProvider';

// A saved checkbox from before resets once ("Hide unused slots", "Only unconnected")
const RESOURCES_TOOLBAR = { world: 'all', hideUnused: false, unconnected: false };
// A node's amounts print in the armory costs' rule, which these pay
const amount = (value) => formatGame(value ?? 0, 'RoyalG.ArmoryUpgCost', { whole: true });
// A balance, as the armory's resource list prints it (N.js:122791, floored): the key is named for a level, but RoyalG[1] holds these
export const resourceBalance = (value) => formatGame(Math.floor(value ?? 0), 'Save.ArmoryLevel', { whole: true });
// One to three columns of rows, as wide as the page allows
const ROWS_GRID_SX = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } };

// sectionFailed: the section's note is the page's first element: no tile numbers, nodes or Toolbar here
const Resources = ({ resources, outposts, resourcePerHour, sectionFailed }) => {
  const { state } = useContext(AppContext);
  const [view, setView, resetView] = useToolbarState('royal-armory-resources', RESOURCES_TOOLBAR);
  const list = sectionFailed ? [] : resources ?? [];
  const worlds = [...new Set(list.map(({ world }) => world))].sort((a, b) => a - b);
  const modeOf = (mapIndex) => outposts?.find((outpost) => outpost.mapIndex === mapIndex)?.mode ?? 0;

  const shown = list.filter((node) => (view?.world === 'all' || `${node.world}` === view?.world)
    && !(view?.hideUnused && node.empty)
    && !(view?.unconnected && node.connected));

  // A spent node pays nothing until a restock refills it, which is the one thing here that
  // costs the player something right now.
  const exhaustedNodes = list.filter(({ exhausted, empty }) => exhausted && !empty).length;
  const unconnected = list.filter(({ connected, empty }) => !connected && !empty).length;
  const tile = (value) => (sectionFailed ? '-' : value);

  // One row per resource rather than per node: several nodes can mine the same resource, and the
  // player plans armory buys off what is banked plus what the outposts bring in over the next day.
  const totals = [...new Map(list.filter(({ empty }) => !empty)
    .map(({ resourceIndex, rawName, stored }) => [resourceIndex, { resourceIndex, rawName, stored }])).values()]
    .map((resource) => ({ ...resource, dailyIncome: (resourcePerHour?.[resource.resourceIndex] ?? 0) * 24 }))
    .sort((a, b) => a.resourceIndex - b.resourceIndex);

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <StatTile label={'Nodes'} value={tile(formatNum(list.filter(({ empty }) => !empty).length))}/>
        <StatTile label={'Spent nodes'} value={tile(formatNum(exhaustedNodes))}/>
        <StatTile label={'Unconnected'} value={tile(formatNum(unconnected))}/>
        <StatTile label={'Total node levels'} value={tile(formatNum(list.reduce((sum, { nodeLevel }) => sum + (nodeLevel ?? 0), 0)))}/>
      </Stack>

      {totals.length ? <Panel title={'Resources in storage'}>
        <Box sx={ROWS_GRID_SX}>
          {totals.map(({ resourceIndex, rawName, stored, dailyIncome }) => <Panel.Row
            key={resourceIndex} icon={`data/${rawName}.png`} name={ROYAL_RESOURCE_NAMES[resourceIndex] ?? `Resource ${resourceIndex}`}
            value={resourceBalance(stored)}
            valueSub={dailyIncome > 0 ? `+${formatGame(dailyIncome, 'RoyalG.OutpostResourceRate')} a day` : 'Not collected'}/>)}
        </Box>
      </Panel> : null}

      {sectionFailed ? null : !list.length
        ? state?.emptyAccount ? <Notice tone={'signin'}>Your kingdom&apos;s resource nodes show here once you sign in.</Notice> : null
        : <Stack direction="column" gap={3}>
          <Toolbar state={view} defaults={RESOURCES_TOOLBAR} onChange={setView} onReset={resetView}
                   total={list.length} shown={shown.length} noun={'nodes'}>
            <Toolbar.Show name={'world'} options={[['all', 'All worlds', list.length],
              ...worlds.map((world) => [`${world}`, `World ${world}`, list.filter((node) => node.world === world).length])]}/>
            <Toolbar.Filter name={'hideUnused'} label={'Hide unused slots'}/>
            <Toolbar.Filter name={'unconnected'} label={'Only unconnected'}/>
          </Toolbar>
          {shown.length ? <CardGrid size={'s'}>
            {shown.map((node) => {
              const { index, empty, rawName, nodeLevel, collected, maxQuantity, stored } = node;
              const { connected, connectedMaps, connectedMap, connectedMapName, exhausted, fillPercent, hoursToEmpty } = node;
              // A Savage Stronghold pours its collection back into the node instead of banking it.
              const collectors = (connectedMaps ?? []).map((mapIndex, order) => (order === 0
                ? connectedMapName || `map ${mapIndex}`
                : outposts?.find((outpost) => outpost.mapIndex === mapIndex)?.name || `map ${mapIndex}`));
              return <ItemCard key={index} icon={empty ? undefined : `data/${rawName}.png`}
                               title={empty ? 'Unused slot' : `Node ${index}`} meta={`Lv ${formatNum(nodeLevel ?? 0)}`}
                               status={!empty && exhausted ? 'needs' : undefined} statusLabel={'Spent'}>
                {empty ? null : <>
                  {/* A spent node's save holds -1, which the parser reads as 0 collected: the pair would say untouched */}
                  {exhausted ? null : <ItemCard.Progress label={'Collected'} percent={100 * (fillPercent ?? 0)}
                                                         value={amount(collected)} max={amount(maxQuantity)}/>}
                  <ItemCard.Facts rows={[
                    hoursToEmpty != null ? ['Empties in', formatDuration(hoursToEmpty * 3600)] : null,
                    ['In storage', resourceBalance(stored)]
                  ]}/>
                </>}
                <ItemCard.Facts rows={[connected
                  ? [modeOf(connectedMap) === 2 ? 'Stockpiled by' : 'Collected by', collectors.join(', ')]
                  : ['Collected by', 'Not connected']]}/>
              </ItemCard>;
            })}
          </CardGrid> : null}
        </Stack>}
    </Stack>
  );
};

export default Resources;
