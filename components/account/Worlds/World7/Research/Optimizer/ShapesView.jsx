import React, { useState } from 'react';
import { Box, ButtonBase, Checkbox, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import ViewSwitch from '@components/common/ViewSwitch';
import DataTable from '@components/common/DataTable';
import { researchGridSquares } from '@website-data';
import { GOAL_NODES, getGridLabel, parseShapeCatalog } from '@parsers/world-7/researchOptimizer';
import ShapeBoard, { cropAround } from './ShapeBoard';
import { GOALS, gainText, pickMoves, shapeName } from './optimizerShared';

const ShapeIcon = ({ entry, shape }) => {
  const scale = 20 / Math.max(entry.width, entry.height, 1);
  const color = (theme) => (theme.vars || theme).palette.identity.researchShapes[shape]?.line;
  return <Box component={'svg'} width={24} height={24} viewBox={'0 0 24 24'} aria-hidden sx={(theme) => ({ color: color(theme), flexShrink: 0 })}>
    <polygon points={entry.polygon.map(([x, y]) => `${2 + x * scale + (20 - entry.width * scale) / 2},${2 + y * scale + (20 - entry.height * scale) / 2}`).join(' ')}
             fill={'currentColor'} fillOpacity={0.35} stroke={'currentColor'} strokeWidth={1.5}/>
  </Box>;
};

const nodeName = (squares, node) => cleanUnderscore(squares?.[node]?.name ?? '');

// A node's bonus as its description template writes it (the parsed one has the numbers filled in):
// '}x' is a multiplier (1 + bonus / 100), '{%' a percent.
const bonusText = (node, value) => {
  const text = researchGridSquares?.[node]?.description ?? '';
  if (text.includes('}x')) return `${formatNum(1 + value / 100)}x`;
  if (text.includes('{%')) return `+${formatNum(value)}%`;
  return formatNum(value);
};

const StepRow = ({ step, index, done, focused, onDone, onFocus, squares, catalog, goal }) => {
  const { to, from, turn, holds } = step;
  const goalHolds = holds.filter((node) => GOAL_NODES[goal].includes(node));
  const others = holds.length - goalHolds.length;
  return <Stack direction={'row'} gap={1} alignItems={'flex-start'}
                sx={{ p: 1, borderRadius: 1, opacity: done ? 0.55 : 1, bgcolor: focused ? 'primary.soft' : undefined }}>
    <Checkbox checked={done} onChange={onDone} inputProps={{ 'aria-label': `Step ${index + 1} done` }} sx={{ p: 0.5 }}/>
    <ButtonBase onClick={onFocus} sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', textAlign: 'left', borderRadius: 1 }}>
      <Stack gap={0.25}>
        <Typography variant={'body2'} sx={{ fontWeight: 500, textDecoration: done ? 'line-through' : 'none' }}>
          {index + 1}. {shapeName(catalog, to.shape)}
        </Typography>
        <Typography variant={'body2'}>
          {turn.presses > 0
            ? `Turn: press the ${turn.button} button ${turn.presses} times (${from.rot % 360}° to ${to.rot % 360}°). `
            : ''}
          Then drag it until it reads Located at ({to.x},{to.y}).
        </Typography>
        <Typography variant={'caption'} color={'text.secondary'}>
          {goalHolds.length ? `Holds ${goalHolds.map((node) => `${getGridLabel(node)} ${nodeName(squares, node)}`).join(', ')}` : 'Holds'}
          {others ? `${goalHolds.length ? ', and ' : ' '}${others} other node${others === 1 ? '' : 's'}` : ''}
        </Typography>
      </Stack>
    </ButtonBase>
  </Stack>;
};

const ShapesView = ({ research, squares, optimizer, goal = 'researchExp' }) => {
  const goalLabel = GOALS[goal].label;
  const input = research?.optimizer;
  const [moves, setMoves] = useState(null);
  const [view, setView] = useState('suggested');
  const [done, setDone] = useState({});
  const [focus, setFocus] = useState(null);
  const catalog = parseShapeCatalog(input?.shapeCatalog?.polygons, input?.shapeCatalog?.dims, input?.shapeCatalog?.bonusPcts);

  if (!input?.shapesOwned) {
    return <Stack gap={2}>
      <Notice>Your first shape comes at Research LV 20. Each shape multiplies the bonus of the grid nodes it covers:</Notice>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1 }}>
        {catalog.map((entry, shape) => <Stack key={shape} direction={'row'} alignItems={'center'} gap={1}
                                              sx={{ p: 1, borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <ShapeIcon entry={entry} shape={shape}/>
          <Typography variant={'body2'}>{shapeName(catalog, shape)}</Typography>
        </Stack>)}
      </Box>
    </Stack>;
  }
  if (optimizer.status !== 'done') {
    return <Panel title={'Finding the best layout'}>
      <Box sx={{ p: 2 }}><LinearProgress variant={'determinate'} value={optimizer.progress * 100}/></Box>
    </Panel>;
  }
  const plans = optimizer.result?.plans ?? [];
  // When no move gains anything worth doing, nothing is suggested until the player picks a number of moves.
  const bestGain = Math.max(0, ...plans.map(({ ratio }) => ratio - 1));
  const chosen = moves ?? (bestGain < 0.0005 ? 0 : pickMoves(plans));
  const plan = chosen === 0 ? { moves: 0, ratio: 1, steps: [], owners: input.owners } : plans[chosen - 1];
  if (!plan) return <Notice tone={'error'}>{optimizer.error ?? 'The search found no layout.'}</Notice>;

  const moved = new Set(plan.steps.map(({ shape }) => shape));
  const stays = input.placements.filter(({ shape }) => !moved.has(shape));
  const pct = (shape) => (shape >= 0 ? catalog[shape]?.bonusPct ?? 0 : 0);
  const changes = input.levels.flatMap((level, node) => (level > 0 && pct(plan.owners[node]) !== pct(input.owners[node]) ? [node] : []));
  const losses = changes.filter((node) => pct(plan.owners[node]) < pct(input.owners[node]));
  const gain = plan.ratio - 1;
  const tiny = gain < 0.0005;
  const hoursNow = research?.timeToLevel;
  const shown = focus ?? Math.max(0, plan.steps.findIndex((_, i) => !done[i]));
  const step = plan.steps[shown];
  const lossesFor = (candidate) => input.levels.flatMap((level, node) => (level > 0 && pct(candidate.owners[node]) < pct(input.owners[node]) ? [node] : []));
  // Only the move counts that add something: a count that gains no more than the one before it is folded into
  // "N or more", so the table ends where the gain stops.
  const worthwhile = plans.reduce((kept, candidate) => (candidate.ratio - (kept.at(-1)?.ratio ?? 1) >= 0.0001 ? [...kept, candidate] : kept), []);
  const lastWorthwhile = worthwhile.at(-1)?.moves ?? 0;
  const bonus = (owners, node) => (input.nodeValue[node] ?? 0) * (1 + pct(owners[node]) / 100);
  const rows = changes.map((node) => ({
    node,
    goal: GOAL_NODES[goal].includes(node),
    name: nodeName(squares, node),
    shapeBefore: shapeName(catalog, input.owners[node]),
    shapeAfter: shapeName(catalog, plan.owners[node]),
    before: bonus(input.owners, node),
    after: bonus(plan.owners, node)
  })).sort((a, b) => Number(b.goal) - Number(a.goal));

  return <Stack gap={3}>
    {/* One block: what to do, how many moves, and only the numbers the headline doesn't already say */}
    <Stack gap={1.5}>
      <Stack direction={'row'} flexWrap={'wrap'} alignItems={'center'} justifyContent={'space-between'} gap={2}>
        <Typography variant={'sectionTitle'} component={'p'} sx={{ flex: '1 1 320px' }}>
          {chosen === 0
            ? `For ${goalLabel}, your shapes are already where I'd put them.`
            : tiny
            ? `Your shapes are within ${gainText(plan.ratio)} of the best layout I found.`
            : `Move ${plan.steps.length} shape${plan.steps.length === 1 ? '' : 's'}: ${gainText(plan.ratio)} ${goalLabel}${losses.length
              ? `, but ${losses.length} node${losses.length === 1 ? '' : 's'} lose${losses.length === 1 ? 's' : ''} part of a bonus: ${losses.map((node) => nodeName(squares, node)).join(', ')}`
              : ', and no node loses its bonus'}.`}
        </Typography>
        <TextField select size={'small'} label={'Shapes to move'} value={chosen} onChange={(event) => setMoves(Number(event.target.value))}
                   sx={{ minWidth: 140 }}>
          <MenuItem value={0}>None</MenuItem>
          {worthwhile.map(({ moves: count }) => <MenuItem key={count} value={count}>{count}</MenuItem>)}
          {worthwhile.some(({ moves: count }) => count === chosen) || chosen === 0 ? null : <MenuItem value={chosen}>{chosen}</MenuItem>}
        </TextField>
      </Stack>
      {goal === 'researchExp' && chosen > 0 ? <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <StatTile label={'Research EXP per hour'}
                  value={`${formatNum(research?.researchEXPrateTOT ?? 0)} → ${formatNum((research?.researchEXPrateTOT ?? 0) * plan.ratio)}`}/>
        {hoursNow > 0 ? <StatTile label={`Research LV ${formatNum((research?.researchLevel ?? 0) + 1)} in`}
                                  value={`${formatDuration(hoursNow * 3600)} → ${formatDuration((hoursNow / plan.ratio) * 3600)}`}/> : null}
      </Stack> : null}
      {/* Worth a table only when move counts differ in what they give */}
      {worthwhile.length >= 2 ? <Box sx={{ overflowX: 'auto' }}>
        <Typography variant={'caption'} color={'text.secondary'}>What each move is worth</Typography>
        <Box component={'table'} sx={{ borderCollapse: 'collapse', '& td, & th': { pr: 2, py: 0.5, textAlign: 'left', fontSize: 13 } }}>
          <thead><tr><th>Moves</th><th>{goalLabel}</th><th>Nodes that lose a bonus</th></tr></thead>
          <tbody>
            {worthwhile.map((candidate) => {
              const lost = lossesFor(candidate);
              return <Box component={'tr'} key={candidate.moves} sx={{ bgcolor: candidate.moves === chosen ? 'primary.soft' : undefined }}>
                <td>{candidate.moves}</td>
                <td>{gainText(candidate.ratio)}</td>
                <Box component={'td'} sx={{ color: lost.length ? 'text.error' : undefined }}>
                  {lost.length ? `✕ ${lost.length}: ${lost.map((node) => nodeName(squares, node)).join(', ')}` : 'None'}
                </Box>
              </Box>;
            })}
            {lastWorthwhile && lastWorthwhile < plans.length ? <tr>
              <td>{lastWorthwhile + 1} or more</td>
              <td>{gainText(worthwhile.at(-1).ratio)}</td>
              <Box component={'td'} sx={{ color: 'text.secondary' }}>No more to gain</Box>
            </tr> : null}
          </tbody>
        </Box>
      </Box> : null}
    </Stack>

    <Notice>Only levelled nodes count: a shape over a node at level 0 gives nothing until you level it.
      {input.canRotate ? '' : ' Turning shapes unlocks at Research LV 90, so until then I move them as they are turned now.'}</Notice>

    <Panel title={'Your grid'} aside={<ViewSwitch options={[['suggested', 'Suggested'], ['now', 'Now']]} value={view} onChange={setView}/>}>
      <Stack direction={'row'} flexWrap={'wrap'} alignItems={'flex-start'}>
      <Box sx={{ p: 1.5, flex: '1 1 420px', maxWidth: 640, display: plan.steps.length && view !== 'now' ? { xs: 'none', sm: 'block' } : 'block' }}>
        <ShapeBoard goalNodes={GOAL_NODES[goal]} catalog={catalog} levels={input.levels} maxLevels={squares.map((square) => square?.maxLv ?? 1)} selectable={input.selectable}
                    stays={view === 'now' ? input.placements : stays}
                    moves={view === 'now' ? [] : plan.steps.map(({ from, to }) => ({ from, to }))} focus={focus}
                    label={view === 'now' ? 'Your Research grid with the shapes where they are now'
                      : 'Your Research grid with the suggested moves, numbered in order'}/>
      </Box>
      {plan.steps.length && view !== 'now' ? <Box sx={{ p: 1.5, display: { xs: 'block', sm: 'none' } }}>
        <ShapeBoard goalNodes={GOAL_NODES[goal]} catalog={catalog} levels={input.levels} maxLevels={squares.map((square) => square?.maxLv ?? 1)}
                    selectable={input.selectable} stays={stays} moves={plan.steps.map(({ from, to }) => ({ from, to }))} focus={focus}
                    view={cropAround(catalog, plan.steps.flatMap(({ from, to }) => [from, to]))} labels
                    label={'The part of your grid that changes, with each cell\'s coordinate'}/>
      </Box> : null}
      <Stack gap={1} sx={{ p: 1.5, flex: '1 1 200px' }}>
        {plan.steps.length ? <>
          <Typography variant={'groupLabel'}>Move, in this order</Typography>
          {plan.steps.map(({ shape }, i) => <Stack key={shape} direction={'row'} alignItems={'center'} gap={1}>
            <Typography variant={'body2'} sx={{ width: 16, fontWeight: 700 }}>{i + 1}</Typography>
            <ShapeIcon entry={catalog[shape]} shape={shape}/>
            <Typography variant={'body2'}>{shapeName(catalog, shape)}</Typography>
          </Stack>)}
        </> : null}
        {stays.length ? <>
          <Typography variant={'groupLabel'} sx={{ mt: plan.steps.length ? 1 : 0 }}>{plan.steps.length ? 'Leave where they are' : 'Your shapes'}</Typography>
          {stays.map(({ shape }) => <Stack key={shape} direction={'row'} alignItems={'center'} gap={1}>
            <Box sx={{ width: 16 }}/>
            <ShapeIcon entry={catalog[shape]} shape={shape}/>
            <Typography variant={'body2'} color={'text.secondary'}>{shapeName(catalog, shape)}</Typography>
          </Stack>)}
        </> : null}
        <Typography variant={'caption'} color={'text.secondary'} sx={{ mt: 1 }}>
          Outlined cells add to {goalLabel}. A moved shape is dashed where it is now.
        </Typography>
      </Stack>
      </Stack>
    </Panel>

    {plan.steps.length ? <Panel title={'In the game'} meta={`${Object.values(done).filter(Boolean).length} of ${plan.steps.length} done`}>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ flex: '0 1 260px', minWidth: 180 }}>
          <ShapeBoard goalNodes={GOAL_NODES[goal]} catalog={catalog} levels={input.levels} maxLevels={squares.map((square) => square?.maxLv ?? 1)} selectable={input.selectable}
                      moves={[{ to: step.to }]} view={cropAround(catalog, [step.to])} labels closeUp
                      label={`Close-up of step ${shown + 1}, with each cell's coordinate`}/>
        </Box>
        <Stack gap={0.5} sx={{ flex: '1 1 160px' }}>
          <Typography variant={'caption'} color={'text.secondary'}>Close-up</Typography>
          <Typography variant={'body2'} sx={{ fontWeight: 500 }}>Step {shown + 1}: {shapeName(catalog, step.to.shape)}</Typography>
          <Typography variant={'caption'} color={'text.secondary'}>Each cell shows its coordinate in the game. Pick a step to see its close-up.</Typography>
        </Stack>
      </Stack>
      <Stack sx={{ p: 1 }}>
        {plan.steps.map((item, i) => <StepRow key={item.shape} step={item} index={i} done={Boolean(done[i])} focused={focus === i}
                                              onDone={() => setDone({ ...done, [i]: !done[i] })}
                                              onFocus={() => setFocus(focus === i ? null : i)} squares={squares} catalog={catalog} goal={goal}/>)}
      </Stack>
      <Box sx={{ px: 2, pt: 1, pb: 2.5 }}>
        <Notice tone={'missing'}>Go in this order and leave the other shapes alone. A moved shape only takes nodes no other shape
          holds, so picking one up, even to put it back, can change who holds a node.</Notice>
      </Box>
    </Panel> : null}

    {rows.length ? <Panel title={'Nodes that change'}>
      <DataTable rowKey={'node'} rows={rows} rowLabel={({ name }) => name} columns={[
        { key: 'name', label: 'Node', value: ({ node, name }) => `${getGridLabel(node)} ${name}` },
        { key: 'adds', label: 'Adds to', value: ({ goal: isGoal }) => (isGoal ? goalLabel : 'Other') },
        { key: 'shape', label: 'Shape', value: ({ shapeBefore, shapeAfter }) => `${shapeBefore} → ${shapeAfter}` },
        { key: 'bonus', label: 'Bonus', numeric: true, value: ({ after }) => after, render: ({ node, before, after }) => `${bonusText(node, before)} → ${bonusText(node, after)}` }
      ]}/>
    </Panel> : null}
  </Stack>;
};

export default ShapesView;
