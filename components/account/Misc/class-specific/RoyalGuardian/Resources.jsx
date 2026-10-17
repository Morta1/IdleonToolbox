import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  LinearProgress,
  Select,
  Stack,
  Typography
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';
import { formatEta } from './formatEta';

const ALL_WORLDS = 'all';

const Resources = ({ resources, outposts, resourcePerHour }) => {
  const [world, setWorld] = useState(ALL_WORLDS);
  const [CheckboxEl, hideEmptyNodes] = useCheckbox('Hide unused slots');
  const [ConnectedEl, onlyUnconnected] = useCheckbox('Only unconnected');

  const list = resources ?? [];
  const worlds = [...new Set(list.map(({ world: nodeWorld }) => nodeWorld))].sort((a, b) => a - b);
  const modeOf = (mapIndex) => outposts?.find((outpost) => outpost.mapIndex === mapIndex)?.mode ?? 0;

  const filtered = list.filter((node) => {
    if (world !== ALL_WORLDS && node.world !== world) return false;
    if (hideEmptyNodes && node.empty) return false;
    if (onlyUnconnected && node.connected) return false;
    return true;
  });

  // An empty node pays nothing until a restock refills it, which is the one thing here that
  // costs the player something right now.
  const exhaustedNodes = list.filter(({ exhausted, empty }) => exhausted && !empty).length;
  const unconnected = list.filter(({ connected, empty }) => !connected && !empty).length;

  // One tile per resource rather than per node: several nodes can mine the same resource, and the
  // player plans armory buys off what is banked plus what the outposts bring in over the next day.
  const totals = [...new Map(list.filter(({ empty }) => !empty)
    .map(({ resourceIndex, rawName, stored }) => [resourceIndex, { resourceIndex, rawName, stored }])).values()]
    .map((resource) => ({ ...resource, dailyIncome: (resourcePerHour?.[resource.resourceIndex] ?? 0) * 24 }))
    .sort((a, b) => a.resourceIndex - b.resourceIndex);

  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={{ xs: 1, md: 3 }} flexWrap="wrap">
        <CardTitleAndValue title="Nodes" value={list.filter(({ empty }) => !empty).length}/>
        <CardTitleAndValue title="Empty Nodes" value={exhaustedNodes}/>
        <CardTitleAndValue title="Unconnected" value={unconnected}/>
        <CardTitleAndValue title="Total Node Levels"
                           value={notateNumber(list.reduce((sum, { nodeLevel }) => sum + nodeLevel, 0))}/>
      </Stack>

      {totals.length > 0 ? <Stack direction="row" gap={{ xs: 1, md: 2 }} flexWrap="wrap">
        {totals.map(({ resourceIndex, rawName, stored, dailyIncome }) => (
          <CardTitleAndValue key={resourceIndex} icon={`data/${rawName}.png`}
                             imgStyle={{ width: 32, height: 32 }} cardSx={{ minWidth: 150 }}
                             value={<Stack>
                               <Typography>{notateNumber(stored, 'Big')}</Typography>
                               <Typography variant="caption"
                                           color={dailyIncome > 0 ? 'success.main' : 'text.secondary'}>
                                 {dailyIncome > 0 ? `+${notateNumber(dailyIncome, 'Big')} / 24h` : 'Not collected'}
                               </Typography>
                             </Stack>}/>
        ))}
      </Stack> : null}

      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>World</InputLabel>
          <Select value={world} label="World" onChange={(e) => setWorld(e.target.value)}>
            <MenuItem value={ALL_WORLDS}>All</MenuItem>
            {worlds.map((nodeWorld) => <MenuItem key={nodeWorld} value={nodeWorld}>World {nodeWorld}</MenuItem>)}
          </Select>
        </FormControl>
        <CheckboxEl/>
        <ConnectedEl/>
      </Stack>

      <Box sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        alignItems: 'stretch'
      }}>
        {filtered.map((node) => {
          const { index, empty, rawName, resourceIndex, nodeLevel, collected, maxQuantity, stored } = node;
          const { connected, connectedMaps, connectedMap, connectedMapName, exhausted, fillPercent, hoursToEmpty } = node;
          // A Savage Stronghold pours its collection back into the node instead of banking it.
          const collectors = connectedMaps.map((mapIndex, order) => (order === 0
            ? connectedMapName || `map ${mapIndex}`
            : outposts?.find((outpost) => outpost.mapIndex === mapIndex)?.name || `map ${mapIndex}`));

          return (
            <Card key={index} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Stack direction="row" gap={1.5} alignItems="center">
                  {empty
                    ? null
                    : <img src={`${prefix}data/${rawName}.png`} alt="" width={32} height={32}
                           style={{ objectFit: 'contain' }}/>}
                  <Stack direction="column">
                    <Typography variant="body2">
                      {empty ? 'Unused slot' : `Node ${index}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lv{nodeLevel}
                    </Typography>
                  </Stack>
                </Stack>

                {empty ? null : <>
                  <Typography variant="caption" sx={{ mt: 1.5 }}>
                    {notateNumber(collected, 'Big')} / {notateNumber(maxQuantity, 'Big')} collected
                    {exhausted ? ' (empty)' : ''}
                  </Typography>
                  <LinearProgress variant="determinate" value={100 * fillPercent}
                                  color={exhausted ? 'warning' : 'primary'}
                                  sx={{ height: 6, borderRadius: 3, mt: 0.5 }}/>
                  {hoursToEmpty != null
                    ? <Typography variant="caption" sx={{ mt: 0.5 }}>Empties in {formatEta(hoursToEmpty)}</Typography>
                    : null}
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    In storage: {notateNumber(stored, 'Big')}
                  </Typography>
                </>}

                <Typography variant="caption" sx={{ mt: 'auto', pt: 1 }}>
                  {connected
                    ? `${modeOf(connectedMap) === 2 ? 'Stockpiled by' : 'Collected by'} ${collectors.join(', ')}`
                    : 'Not connected'}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
};

export default Resources;
