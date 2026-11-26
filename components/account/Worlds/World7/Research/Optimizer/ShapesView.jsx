import React, { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, LinearProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import DataTable from '@components/common/DataTable';
import { researchGridSquares } from '@website-data';
import {
  GOAL_NODES,
  applyShapeMoves,
  createResearchScorer,
  getCoveredNodes,
  getGridLabel,
  parseShapeCatalog
} from '@parsers/world-7/researchOptimizer';
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

// A gain smaller than this (as a share) is not worth a move of its own
const SMALL_GAIN = 0.0005;

const StepRow = ({ step, index, done, current, gainSoFar, onTick, onPick, closeUp, squares, catalog, goal }) => {
  const { to, from, turn, holds } = step;
  const goalHolds = holds.filter((node) => GOAL_NODES[goal].includes(node));
  const others = holds.length - goalHolds.length;
  return <Stack direction={'row'} gap={1} alignItems={'flex-start'}
                sx={{ px: 1, py: 1, borderRadius: 1, opacity: done ? 0.55 : 1, bgcolor: current ? 'primary.soft' : undefined }}>
    <Checkbox checked={done} onChange={onTick} inputProps={{ 'aria-label': `Move ${index + 1} done` }} sx={{ p: 0.25 }}/>
    <Stack gap={1} sx={{ minWidth: 0, flex: 1 }}>
      <ButtonBase onClick={onPick} sx={{ justifyContent: 'flex-start', textAlign: 'left', borderRadius: 1 }}>
        <Stack gap={0.25} sx={{ minWidth: 0 }}>
          <Typography variant={'body2'} sx={{ fontWeight: 500, lineHeight: '26px' }}>{index + 1}. {shapeName(catalog, to.shape)}</Typography>
          <Typography variant={'caption'} color={'text.success'}>{gainText(gainSoFar)} after this move</Typography>
          <Typography variant={'body2'}>
            {turn.presses > 0
              ? `Turn: press the ${turn.button} button ${turn.presses} times (${from.rot % 360}° to ${to.rot % 360}°). Then drag`
              : 'Drag'} it until it reads Located at ({to.x},{to.y}).
          </Typography>
          <Typography variant={'caption'} color={'text.secondary'}>
            {goalHolds.length ? `Holds ${goalHolds.map((node) => `${getGridLabel(node)} ${nodeName(squares, node)}`).join(', ')}` : 'Holds'}
            {others ? `${goalHolds.length ? ', and ' : ' '}${others} other node${others === 1 ? '' : 's'}` : ''}
          </Typography>
        </Stack>
      </ButtonBase>
      {closeUp ? <Box sx={{ maxWidth: 240 }}>{closeUp}</Box> : null}
    </Stack>
  </Stack>;
};

/**
 * The shapes half: a numbered list of moves and one grid showing all of them. The moves depend on their order (a moved
 * shape only takes free nodes), so ticking a move ticks the ones before it too, and the first one not done is the one
 * to make next. Each move says what the moves up to it give, and a long plan folds the moves that add almost nothing.
 */
const ShapesView = ({ research, squares, optimizer, goal = 'researchExp' }) => {
  const goalLabel = GOALS[goal].label;
  const input = research?.optimizer;
  const [doneThrough, setDoneThrough] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showAll, setShowAll] = useState(false);
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
  const bestGain = Math.max(0, ...plans.map(({ ratio }) => ratio - 1));
  // The fewest moves that reach the gain; nothing when no move gains anything worth doing.
  const plan = bestGain < SMALL_GAIN ? { moves: 0, ratio: 1, steps: [], owners: input.owners } : plans[pickMoves(plans) - 1];
  if (!plan) return <Notice tone={'error'}>{optimizer.error ?? 'The search found no layout.'}</Notice>;

  const steps = plan.steps;
  const scorer = createResearchScorer(input);
  const coverage = input.placements.map((placement) => getCoveredNodes(catalog[placement.shape], placement, input.selectable));
  const moves = steps.map(({ to }) => ({ ...to, covered: getCoveredNodes(catalog[to.shape], to, input.selectable) }));
  const now = scorer.goalRate(goal, input.owners, input.lensSlots) || 1;
  // What the moves up to and including each one give
  const gainAfter = steps.map((_, i) => scorer.goalRate(goal, applyShapeMoves(input.owners, coverage, moves.slice(0, i + 1)), input.lensSlots) / now);
  // A plan of 3 or more folds the moves after the gain is all but reached
  const reached = steps.length >= 3 ? gainAfter.findIndex((ratio) => plan.ratio - ratio < SMALL_GAIN) : -1;
  const shownCount = !showAll && reached >= 0 && reached < steps.length - 1 ? reached + 1 : steps.length;
  const current = picked ?? (doneThrough < steps.length ? doneThrough : null);
  const moved = new Set(steps.map(({ shape }) => shape));
  const stays = input.placements.filter(({ shape }) => !moved.has(shape));
  const boardMoves = steps.slice(0, shownCount).map(({ from, to }, i) => ({ from, to, number: i + 1 }));
  const stillStays = [...stays, ...steps.slice(shownCount).map(({ from }) => from)];

  const pct = (shape) => (shape >= 0 ? catalog[shape]?.bonusPct ?? 0 : 0);
  const changes = input.levels.flatMap((level, node) => (level > 0 && pct(plan.owners[node]) !== pct(input.owners[node]) ? [node] : []));
  const losses = changes.filter((node) => pct(plan.owners[node]) < pct(input.owners[node]));
  const hoursNow = research?.timeToLevel;
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
  const board = (props) => <ShapeBoard goalNodes={GOAL_NODES[goal]} catalog={catalog} levels={input.levels}
                                       maxLevels={squares.map((square) => square?.maxLv ?? 1)} selectable={input.selectable} {...props}/>;
  const tick = (i) => {
    setDoneThrough(i < doneThrough ? i : i + 1);
    setPicked(null);
  };

  return <Stack gap={3}>
    <Stack gap={1.5}>
      <Typography variant={'sectionTitle'} component={'p'}>
        {!steps.length
          ? `For ${goalLabel}, your shapes are already where I'd put them.`
          : `Move ${steps.length} shape${steps.length === 1 ? '' : 's'}: ${gainText(plan.ratio)} ${goalLabel}${losses.length
            ? `, but ${losses.map((node) => `${nodeName(squares, node)} drops from ${bonusText(node, bonus(input.owners, node))} to ${bonusText(node, bonus(plan.owners, node))}`).join(', ')}`
            : ', and no node loses its bonus'}.`}
      </Typography>
      {goal === 'researchExp' && steps.length ? <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <StatTile label={'Research EXP per hour'}
                  value={`${formatNum(research?.researchEXPrateTOT ?? 0)} → ${formatNum((research?.researchEXPrateTOT ?? 0) * plan.ratio)}`}/>
        {hoursNow > 0 ? <StatTile label={`Research LV ${formatNum((research?.researchLevel ?? 0) + 1)} in`}
                                  value={`${formatDuration(hoursNow * 3600)} → ${formatDuration((hoursNow / plan.ratio) * 3600)}`}/> : null}
      </Stack> : null}
    </Stack>

    <Notice>Only levelled nodes count: a shape over a node at level 0 gives nothing until you level it.
      {input.canRotate ? '' : ' Turning shapes unlocks at Research LV 90, so until then I move them as they are turned now.'}</Notice>

    <Stack direction={'row'} flexWrap={'wrap'} gap={2} alignItems={'flex-start'}>
      <Panel title={'Your grid'} sx={{ flex: '1 1 460px', minWidth: 0 }}>
        <Stack gap={1.5} sx={{ p: 2 }}>
          {/* On a phone the whole grid is too small to read: each move's close-up in its row does the job there */}
          <Box sx={{ display: steps.length ? { xs: 'none', sm: 'block' } : 'block' }}>
            {board({
              stays: stillStays, moves: boardMoves, focus: picked,
              label: steps.length ? 'Your Research grid with the moves, numbered in order' : 'Your Research grid'
            })}
          </Box>
          <Typography variant={'caption'} color={'text.secondary'} component={'p'}>
            Outlined cells add to {goalLabel}.{steps.length ? ' Numbered shapes move: dashed is where each is now, solid is where it goes.' : ''}
          </Typography>
        </Stack>
      </Panel>

      {steps.length ? <Panel title={'Moves'} meta={`${Math.min(doneThrough, steps.length)} / ${steps.length} done`} sx={{ flex: '1 1 380px', minWidth: 0 }}>
        <Stack gap={1.5} sx={{ p: 2 }}>
          {/* The rows' highlight reaches 8 px past the text, which lines up with the panel's 16 px */}
          <Stack sx={{ mx: -1 }}>
            {steps.slice(0, shownCount).map((step, i) => <StepRow
              key={step.shape} step={step} index={i} gainSoFar={gainAfter[i]} done={i < doneThrough} current={i === current}
              onTick={() => tick(i)} onPick={() => setPicked(picked === i ? null : i)} squares={squares} catalog={catalog} goal={goal}
              closeUp={i === current ? board({
                stays: [], moves: [{ to: step.to }], view: cropAround(catalog, [step.to]), labels: true, closeUp: true,
                label: `Close-up of move ${i + 1}, with each cell's coordinate`
              }) : null}/>)}
          </Stack>
          {shownCount < steps.length ? <Button size={'small'} color={'inherit'} onClick={() => setShowAll(true)} sx={{ alignSelf: 'flex-start' }}>
            {steps.length - shownCount} more move{steps.length - shownCount === 1 ? '' : 's'} add only {gainText(plan.ratio / gainAfter[shownCount - 1])}
          </Button> : null}
          {/* With one move there is no order to keep, but touching another shape still can move nodes */}
          <Notice tone={'missing'}>{steps.length > 1 ? 'Go in this order and leave the other shapes alone. ' : 'Leave the other shapes alone. '}A
            moved shape only takes nodes no other shape holds, so picking one up, even to put it back, can change who holds a node.</Notice>
        </Stack>
      </Panel> : null}
    </Stack>

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
