import React, { useState } from 'react';
import { Box, Button, ButtonBase, LinearProgress, Stack, Typography } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
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

const StepRow = ({ step, index, state, gainSoFar, onPick, squares, catalog, goal }) => {
  const { to, from, turn, holds } = step;
  const goalHolds = holds.filter((node) => GOAL_NODES[goal].includes(node));
  const others = holds.length - goalHolds.length;
  return <ButtonBase onClick={onPick} sx={{
    justifyContent: 'flex-start', textAlign: 'left', borderRadius: 1, px: 1, py: 1.25, gap: 1.5, alignItems: 'flex-start',
    opacity: state === 'done' ? 0.55 : 1, bgcolor: state === 'current' ? 'primary.soft' : undefined
  }}>
    <Box sx={{ width: 20, flexShrink: 0, lineHeight: '20px', color: state === 'done' ? 'text.success' : 'text.secondary', fontWeight: 700, fontSize: 14 }}>
      {state === 'done' ? <IconCheck size={18}/> : index + 1}
    </Box>
    <Stack gap={0.25} sx={{ minWidth: 0 }}>
      <Typography variant={'body2'} sx={{ fontWeight: 500 }}>
        {shapeName(catalog, to.shape)}
      </Typography>
      <Typography variant={'caption'} color={'text.success'}>{gainText(gainSoFar)} so far</Typography>
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
  </ButtonBase>;
};

/**
 * The shapes half. The moves are order dependent (a moved shape only takes free nodes), so progress is a cursor, as
 * on the Construction board: everything before it is done, the board shows the grid at that point, and the next move
 * is drawn on it. Each step says what the moves so far give, so a player can stop where the gain gets small.
 */
const ShapesView = ({ research, squares, optimizer, goal = 'researchExp' }) => {
  const goalLabel = GOALS[goal].label;
  const input = research?.optimizer;
  const [cursor, setCursor] = useState(0);
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
  const plan = bestGain < 0.0005 ? { moves: 0, ratio: 1, steps: [], owners: input.owners } : plans[pickMoves(plans) - 1];
  if (!plan) return <Notice tone={'error'}>{optimizer.error ?? 'The search found no layout.'}</Notice>;

  const steps = plan.steps;
  const scorer = createResearchScorer(input);
  const coverage = input.placements.map((placement) => getCoveredNodes(catalog[placement.shape], placement, input.selectable));
  const moves = steps.map(({ to }) => ({ ...to, covered: getCoveredNodes(catalog[to.shape], to, input.selectable) }));
  const now = scorer.goalRate(goal, input.owners, input.lensSlots) || 1;
  // What the moves up to and including each step give
  const gainAfter = steps.map((_, i) => scorer.goalRate(goal, applyShapeMoves(input.owners, coverage, moves.slice(0, i + 1)), input.lensSlots) / now);
  const at = Math.min(cursor, steps.length);
  const finished = at >= steps.length;
  const next = steps[at];
  // The grid at the cursor: shapes already moved sit where they go, the rest where they are now
  const placedAt = (shape) => {
    const index = steps.findIndex((step) => step.shape === shape);
    return index >= 0 && index < at ? steps[index].to : input.placements[shape];
  };
  const stays = input.placements.filter(({ shape }) => shape !== next?.shape).map(({ shape }) => placedAt(shape));
  const boardMoves = next ? [{ from: next.from, to: next.to, number: at + 1 }] : [];

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

  return <Stack gap={3}>
    <Stack gap={1.5}>
      <Typography variant={'sectionTitle'} component={'p'}>
        {!steps.length
          ? `For ${goalLabel}, your shapes are already where I'd put them.`
          : `Move ${steps.length} shape${steps.length === 1 ? '' : 's'}: ${gainText(plan.ratio)} ${goalLabel}${losses.length
            ? `, but ${losses.length} node${losses.length === 1 ? '' : 's'} lose${losses.length === 1 ? 's' : ''} part of a bonus: ${losses.map((node) => nodeName(squares, node)).join(', ')}`
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
      <Panel title={'Your grid'} meta={steps.length ? (finished ? 'After every step' : at ? `After ${at} step${at === 1 ? '' : 's'}` : 'Now') : undefined}
             sx={{ flex: '1 1 460px', minWidth: 0 }}>
        <Stack gap={1.5} sx={{ p: 2 }}>
        <Box sx={{ display: next ? { xs: 'none', sm: 'block' } : 'block' }}>
          {board({ stays, moves: boardMoves, label: `Your Research grid ${at ? `after ${at} step${at === 1 ? '' : 's'}` : 'now'}${next ? `, with step ${at + 1} drawn on it` : ''}` })}
        </Box>
        {/* On a phone the whole board is too small to read: the part the next step changes */}
        {next ? <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          {board({ stays, moves: boardMoves, view: cropAround(catalog, [next.from, next.to]), labels: true,
            label: `The part of your grid that step ${at + 1} changes, with each cell's coordinate` })}
        </Box> : null}
        <Typography variant={'caption'} color={'text.secondary'} component={'p'}>
          Outlined cells add to {goalLabel}. The next shape to move is dashed where it is now and solid where it goes.
        </Typography>
        </Stack>
      </Panel>

      {steps.length ? <Panel title={'Steps to apply'} meta={`${at} / ${steps.length}`} sx={{ flex: '1 1 380px', minWidth: 0 }}>
        <Stack gap={2} sx={{ p: 2 }}>
          <LinearProgress variant={'determinate'} value={(at / steps.length) * 100} sx={{ height: 6, borderRadius: 3 }}/>
          <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
            <Button size={'small'} variant={'outlined'} disabled={at === 0} onClick={() => setCursor(at - 1)}>Back</Button>
            <Button size={'small'} variant={'contained'} disabled={finished} onClick={() => setCursor(at + 1)}>Next</Button>
            <Typography variant={'body2'} color={'text.secondary'}>
              {finished ? `${steps.length === 1 ? 'Done' : `All ${steps.length} steps done`}: ${gainText(plan.ratio)} ${goalLabel}` : `Step ${at + 1} of ${steps.length}`}
            </Typography>
            {at > 0 ? <Button size={'small'} color={'inherit'} onClick={() => setCursor(0)}>Reset</Button> : null}
          </Stack>
          {next ? <Stack direction={'row'} flexWrap={'wrap'} gap={2} alignItems={'flex-start'}>
            <Box sx={{ flex: '0 1 220px', minWidth: 160 }}>
              {board({ moves: [{ to: next.to }], view: cropAround(catalog, [next.to]), labels: true, closeUp: true,
                label: `Close-up of step ${at + 1}, with each cell's coordinate` })}
            </Box>
            <Typography variant={'caption'} color={'text.secondary'} sx={{ flex: '1 1 140px' }}>
              Where step {at + 1} puts the {shapeName(catalog, next.shape)}. Each cell shows its coordinate in the game.
            </Typography>
          </Stack> : null}
        {/* The rows' highlight reaches 8 px past the text, which lines up with the panel's 16 px */}
        <Stack sx={{ mx: -1 }}>
          {steps.map((step, i) => <StepRow key={step.shape} step={step} index={i} gainSoFar={gainAfter[i]}
                                           state={i < at ? 'done' : i === at ? 'current' : 'next'} onPick={() => setCursor(i)}
                                           squares={squares} catalog={catalog} goal={goal}/>)}
        </Stack>
        <Notice tone={'missing'}>Go in this order and leave the other shapes alone. A moved shape only takes nodes no other shape
          holds, so picking one up, even to put it back, can change who holds a node.</Notice>
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
