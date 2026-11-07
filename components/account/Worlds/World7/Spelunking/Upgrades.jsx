import { groupUpgradesByColumn } from '@parsers/world-7/spelunking';
import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import GroupedView from './Upgrades/GroupedView';
import PathView, { buildDependencyTree } from './Upgrades/PathView';

const UPGRADES_TOOLBAR = { search: '', hideMaxed: false, view: 'group' };
const isMaxed = (upgrade) => upgrade?.level >= upgrade?.x3;

const Upgrades = ({ upgrades, totalUpgradeLevels, amber, denominator, amberIndex }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('spelunking-upgrades', UPGRADES_TOOLBAR);
  const search = (toolbar?.search ?? '').trim().toLowerCase();
  const matches = (upgrade) => (!search || cleanUnderscore(upgrade?.name).toLowerCase().includes(search)
    || cleanUnderscore(upgrade?.description).toLowerCase().includes(search)) && !(toolbar?.hideMaxed && isMaxed(upgrade));
  const shown = upgrades?.filter(matches) ?? [];
  const grouped = Object.fromEntries(Object.entries(groupUpgradesByColumn(upgrades ?? []))
    .map(([key, list]) => [key, list.filter(matches)]).filter(([, list]) => list.length));
  // A path keeps the upgrades above a match, so the tree still reads from its root. Those draw muted, as context, so
  // the matches the result line counts stand out.
  const keep = (node) => {
    const children = node?.children?.map(keep).filter(Boolean) ?? [];
    const match = matches(node);
    return match || children.length ? { ...node, children, context: !match } : null;
  };
  const roots = buildDependencyTree(upgrades ?? []).map(keep).filter(Boolean);

  return <Stack gap={3}>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'Total upgrade LV'} value={totalUpgradeLevels ?? 0} kind={'amount'}/>
    </Stack>
    <Box>
      <Toolbar state={toolbar} defaults={UPGRADES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={upgrades?.length ?? 0} shown={shown.length} noun={'upgrades'}>
        <Toolbar.Search placeholder={'Search upgrades'}/>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        <Toolbar.View options={[['group', 'By column'], ['path', 'Paths']]}/>
      </Toolbar>
      {toolbar?.view === 'path'
        ? <PathView roots={roots}/>
        : <GroupedView grouped={grouped} amber={amber} denominator={denominator} amberIndex={amberIndex}/>}
    </Box>
  </Stack>;
};

export default Upgrades;
